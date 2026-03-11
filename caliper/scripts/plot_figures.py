#!/usr/bin/env python3
import json
import re
import html
from pathlib import Path

import matplotlib.pyplot as plt


def _load_json(path: Path):
    with path.open('r', encoding='utf-8') as f:
        content = f.read()
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        if '<!doctype html>' in content.lower():
            raise ValueError(
                f'Report is HTML, not JSON: {path}. Re-run benchmark with --caliper-report-format json.'
            ) from exc
        raise


def _find_rounds(data):
    if isinstance(data, dict):
        for key in ('results', 'rounds', 'benchmarks'):
            val = data.get(key)
            if isinstance(val, list):
                return [r for r in val if isinstance(r, dict)]

        stack = [data]
        while stack:
            cur = stack.pop()
            for _, v in cur.items():
                if isinstance(v, dict):
                    stack.append(v)
                elif isinstance(v, list) and v and all(isinstance(x, dict) for x in v):
                    if any('label' in x or 'name' in x for x in v):
                        return v

    if isinstance(data, list):
        return [r for r in data if isinstance(r, dict)]

    return []


def _extract_label(round_data):
    return str(
        round_data.get('label')
        or round_data.get('name')
        or round_data.get('description')
        or 'unknown'
    )


def _extract_send_rate(label):
    match = re.search(r'(\d+)', label)
    return int(match.group(1)) if match else 0


def _to_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _latency_to_seconds(value, unit):
    v = _to_float(value, 0.0)
    if unit == 'ms':
        return v / 1000.0
    return v


def _extract_throughput(round_data):
    throughput = round_data.get('throughput')
    if isinstance(throughput, dict):
        for k in ('avg', 'max', 'min'):
            v = throughput.get(k)
            if isinstance(v, (int, float)):
                return float(v)
    if isinstance(throughput, (int, float)):
        return float(throughput)

    tx_summary = round_data.get('txSummary')
    if isinstance(tx_summary, dict):
        v = tx_summary.get('throughput')
        if isinstance(v, (int, float)):
            return float(v)

    for key in ('tps', 'sendRate', 'rate'):
        v = round_data.get(key)
        if isinstance(v, (int, float)):
            return float(v)

    return 0.0


def _extract_send_rate_tps(round_data, label):
    for key in ('sendRate', 'rate'):
        v = round_data.get(key)
        if isinstance(v, (int, float)):
            return float(v)

    tx_summary = round_data.get('txSummary')
    if isinstance(tx_summary, dict):
        for key in ('sendRate', 'rate'):
            v = tx_summary.get(key)
            if isinstance(v, (int, float)):
                return float(v)

    return float(_extract_send_rate(label))


def _extract_latency_seconds(round_data, key_name):
    latency = round_data.get('latency')
    if isinstance(latency, dict):
        key_map = {
            'min': ('min',),
            'avg': ('avg', 'average'),
            'max': ('max',)
        }
        for k in key_map[key_name]:
            v = latency.get(k)
            if isinstance(v, (int, float)):
                return float(v) / 1000.0
    if isinstance(latency, (int, float)):
        return float(latency) / 1000.0

    tx_summary = round_data.get('txSummary')
    if isinstance(tx_summary, dict):
        lat = tx_summary.get('latency')
        if isinstance(lat, dict):
            key_map = {
                'min': ('min',),
                'avg': ('avg', 'average'),
                'max': ('max',)
            }
            for k in key_map[key_name]:
                v = lat.get(k)
                if isinstance(v, (int, float)):
                    return float(v) / 1000.0

    alias_map = {
        'min': ('latencyMin', 'minLatency'),
        'avg': ('latencyAvg', 'avgLatency'),
        'max': ('latencyMax', 'maxLatency')
    }
    for key in alias_map[key_name]:
        v = round_data.get(key)
        if isinstance(v, (int, float)):
            return float(v) / 1000.0

    return 0.0


def _read_report(path: Path):
    content = path.read_text(encoding='utf-8')

    try:
        data = json.loads(content)
        rounds = _find_rounds(data)
        parsed = []
        for r in rounds:
            label = _extract_label(r)
            avg_latency_s = _extract_latency_seconds(r, 'avg')
            parsed.append(
                {
                    'label': label,
                    'tx_load': _extract_send_rate(label),
                    'send_rate_tps': _extract_send_rate_tps(r, label),
                    'throughput': _extract_throughput(r),
                    'min_latency_s': _extract_latency_seconds(r, 'min'),
                    'avg_latency_s': avg_latency_s,
                    'max_latency_s': _extract_latency_seconds(r, 'max'),
                    'latency_ms': avg_latency_s * 1000.0,
                }
            )
        return parsed
    except json.JSONDecodeError:
        if '<!doctype html>' not in content.lower():
            raise

    summary_match = re.search(
        r'id=\"benchmarksummary\".*?<table.*?>(.*?)</table>',
        content,
        flags=re.IGNORECASE | re.DOTALL
    )
    table_html = summary_match.group(1) if summary_match else content

    parsed = []
    unit = 's'
    for row_html in re.findall(r'<tr>(.*?)</tr>', table_html, flags=re.IGNORECASE | re.DOTALL):
        cells = re.findall(r'<t[dh]>(.*?)</t[dh]>', row_html, flags=re.IGNORECASE | re.DOTALL)
        if len(cells) < 8:
            continue

        cleaned = []
        for cell in cells:
            text = re.sub(r'<.*?>', '', cell, flags=re.DOTALL)
            cleaned.append(html.unescape(text).strip())

        if cleaned[0].lower() == 'name':
            # Detect latency unit from summary header.
            header = ' '.join(cleaned).lower()
            if 'latency (ms)' in header:
                unit = 'ms'
            continue

        label = cleaned[0]
        tx_load = _extract_send_rate(label)
        send_rate_tps = _to_float(cleaned[3], float(tx_load))
        throughput = _to_float(cleaned[7], 0.0)
        max_latency_s = _latency_to_seconds(cleaned[4], unit) if cleaned[4] != '-' else 0.0
        min_latency_s = _latency_to_seconds(cleaned[5], unit) if cleaned[5] != '-' else 0.0
        avg_latency_s = _latency_to_seconds(cleaned[6], unit) if cleaned[6] != '-' else 0.0

        parsed.append(
            {
                'label': label,
                'tx_load': tx_load,
                'send_rate_tps': send_rate_tps,
                'throughput': throughput,
                'min_latency_s': min_latency_s,
                'avg_latency_s': avg_latency_s,
                'max_latency_s': max_latency_s,
                'latency_ms': avg_latency_s * 1000.0,
            }
        )

    return parsed


def plot_throughput(write_rows, read_rows, output_file: Path):
    write_sorted = sorted(write_rows, key=lambda x: x['tx_load'])
    read_sorted = sorted(read_rows, key=lambda x: x['tx_load'])

    x_write = [r['tx_load'] for r in write_sorted]
    y_write = [r['throughput'] for r in write_sorted]

    x_read = [r['tx_load'] for r in read_sorted]
    y_read = [r['throughput'] for r in read_sorted]

    plt.figure(figsize=(12, 6))
    plt.plot(x_write, y_write, marker='s', linewidth=2.0, label='Write Tx (createPoultryBatch)')
    plt.plot(x_read, y_read, marker='o', linestyle='--', linewidth=2.0, label='Read Query (getBatchById)')
    plt.title('Throughput Evaluation (TPS) vs Increased Transaction Load', fontsize=14, weight='bold')
    plt.xlabel('Transaction Send Rate (TPS)', fontsize=12)
    plt.ylabel('Achieved Throughput (TPS)', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.4)
    plt.legend(loc='best')
    plt.tight_layout()
    plt.savefig(output_file, dpi=180)
    plt.close()


def plot_latency(latency_rows, output_file: Path):
    rows = [r for r in latency_rows if r['label']]
    labels = [r['label'] for r in rows]
    values = [r['latency_ms'] for r in rows]
    colors = ['#1f77b4', '#2ca02c', '#d62728', '#9467bd', '#ff7f0e']

    plt.figure(figsize=(12, 6))
    bars = plt.bar(labels, values, color=colors[: len(labels)], edgecolor='black', linewidth=0.6)

    for bar, value in zip(bars, values):
        text = f'{value:.0f} ms' if value >= 1 else f'{value:.2f} ms'
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 3, text, ha='center', va='bottom', fontsize=10)

    plt.title('Average Transaction Latency', fontsize=14, weight='bold')
    plt.ylabel('Average Transaction Latency (ms)', fontsize=12)
    plt.grid(axis='y', linestyle='--', alpha=0.4)
    plt.xticks(rotation=8)
    plt.tight_layout()
    plt.savefig(output_file, dpi=180)
    plt.close()


def plot_send_rate(write_rows, read_rows, output_file: Path):
    write_sorted = sorted(write_rows, key=lambda x: x['tx_load'])
    read_sorted = sorted(read_rows, key=lambda x: x['tx_load'])

    labels = [str(r['tx_load']) for r in write_sorted]
    x = list(range(len(labels)))
    width = 0.36
    write_values = [r['send_rate_tps'] for r in write_sorted]
    read_values = [r['send_rate_tps'] for r in read_sorted]

    plt.figure(figsize=(12, 6))
    plt.bar([i - width / 2 for i in x], write_values, width=width, label='Write Tx')
    plt.bar([i + width / 2 for i in x], read_values, width=width, label='Read Query')
    plt.title('Send Rate (TPS)', fontsize=14, weight='bold')
    plt.xlabel('Transaction', fontsize=12)
    plt.ylabel('TPS', fontsize=12)
    plt.xticks(x, labels)
    plt.grid(axis='y', linestyle='--', alpha=0.4)
    plt.legend(loc='best')
    plt.tight_layout()
    plt.savefig(output_file, dpi=180)
    plt.close()


def plot_latency_line(write_rows, read_rows, key, title, output_file: Path):
    write_sorted = sorted(write_rows, key=lambda x: x['tx_load'])
    read_sorted = sorted(read_rows, key=lambda x: x['tx_load'])

    x_write = [r['tx_load'] for r in write_sorted]
    y_write = [r[key] for r in write_sorted]
    x_read = [r['tx_load'] for r in read_sorted]
    y_read = [r[key] for r in read_sorted]

    plt.figure(figsize=(10, 6))
    plt.plot(x_write, y_write, marker='o', linewidth=2.0, label='Write Tx')
    plt.plot(x_read, y_read, marker='o', linewidth=2.0, label='Read Query')
    plt.title(title, fontsize=14, weight='bold')
    plt.xlabel('Transaction', fontsize=12)
    plt.ylabel('Seconds', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.4)
    plt.legend(loc='best')
    plt.tight_layout()
    plt.savefig(output_file, dpi=180)
    plt.close()


def main():
    base = Path(__file__).resolve().parents[1]
    def resolve_report(candidates):
        for candidate in candidates:
            if candidate.exists():
                return candidate
        return candidates[0]

    write_report = resolve_report([
        base / 'results' / 'highload-throughput-write' / 'report.json',
        base / 'results' / 'highload-throughput-write' / 'report',
        base / 'results' / 'throughput-write-report' / 'report.json',
        base / 'results' / 'throughput-write-report' / 'report',
        base / 'results' / 'throughput-write-report' / 'report.txt',
        base / 'results' / 'throughput-write-report.json'
    ])
    read_report = resolve_report([
        base / 'results' / 'highload-throughput-read' / 'report.json',
        base / 'results' / 'highload-throughput-read' / 'report',
        base / 'results' / 'throughput-read-report' / 'report.json',
        base / 'results' / 'throughput-read-report' / 'report',
        base / 'results' / 'throughput-read-report' / 'report.txt',
        base / 'results' / 'throughput-read-report.json'
    ])
    latency_report = resolve_report([
        base / 'results' / 'highload-latency-report' / 'report.json',
        base / 'results' / 'highload-latency-report' / 'report',
        base / 'results' / 'latency-report' / 'report.json',
        base / 'results' / 'latency-report' / 'report',
        base / 'results' / 'latency-report' / 'report.txt',
        base / 'results' / 'latency-report.json'
    ])

    for report in (write_report, read_report, latency_report):
        if not report.exists():
            raise FileNotFoundError(f'Missing report file: {report}')

    write_rows = _read_report(write_report)
    read_rows = _read_report(read_report)
    latency_rows = _read_report(latency_report)

    figures_dir = base / 'results' / 'figures'
    figures_dir.mkdir(parents=True, exist_ok=True)

    throughput_png = figures_dir / 'figure-throughput-vs-load.png'
    latency_png = figures_dir / 'figure-average-latency.png'
    send_rate_png = figures_dir / 'figure-send-rate-vs-transaction.png'
    min_latency_png = figures_dir / 'figure-min-latency-vs-transaction.png'
    avg_latency_png = figures_dir / 'figure-avg-latency-vs-transaction.png'
    max_latency_png = figures_dir / 'figure-max-latency-vs-transaction.png'

    plot_throughput(write_rows, read_rows, throughput_png)
    plot_latency(latency_rows, latency_png)
    plot_send_rate(write_rows, read_rows, send_rate_png)
    plot_latency_line(write_rows, read_rows, 'min_latency_s', 'Min Latency (s)', min_latency_png)
    plot_latency_line(write_rows, read_rows, 'avg_latency_s', 'Average Latency (s)', avg_latency_png)
    plot_latency_line(write_rows, read_rows, 'max_latency_s', 'Max Latency (s)', max_latency_png)

    print(f'Created: {throughput_png}')
    print(f'Created: {latency_png}')
    print(f'Created: {send_rate_png}')
    print(f'Created: {min_latency_png}')
    print(f'Created: {avg_latency_png}')
    print(f'Created: {max_latency_png}')


if __name__ == '__main__':
    main()

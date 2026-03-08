#!/usr/bin/env python3
import json
import os
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


def _extract_avg_latency(round_data):
    latency = round_data.get('latency')
    if isinstance(latency, dict):
        for k in ('avg', 'average'):
            v = latency.get(k)
            if isinstance(v, (int, float)):
                return float(v)
    if isinstance(latency, (int, float)):
        return float(latency)

    tx_summary = round_data.get('txSummary')
    if isinstance(tx_summary, dict):
        lat = tx_summary.get('latency')
        if isinstance(lat, dict):
            for k in ('avg', 'average'):
                v = lat.get(k)
                if isinstance(v, (int, float)):
                    return float(v)

    for key in ('latencyAvg', 'avgLatency'):
        v = round_data.get(key)
        if isinstance(v, (int, float)):
            return float(v)

    return 0.0


def _read_report(path: Path):
    content = path.read_text(encoding='utf-8')

    try:
        data = json.loads(content)
        rounds = _find_rounds(data)
        parsed = []
        for r in rounds:
            label = _extract_label(r)
            parsed.append(
                {
                    'label': label,
                    'send_rate': _extract_send_rate(label),
                    'throughput': _extract_throughput(r),
                    'latency_ms': _extract_avg_latency(r),
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
    for row_html in re.findall(r'<tr>(.*?)</tr>', table_html, flags=re.IGNORECASE | re.DOTALL):
        cells = re.findall(r'<t[dh]>(.*?)</t[dh]>', row_html, flags=re.IGNORECASE | re.DOTALL)
        if len(cells) < 8:
            continue

        cleaned = []
        for cell in cells:
            text = re.sub(r'<.*?>', '', cell, flags=re.DOTALL)
            cleaned.append(html.unescape(text).strip())

        if cleaned[0].lower() == 'name':
            continue

        label = cleaned[0]
        send_rate = _extract_send_rate(label)
        try:
            throughput = float(cleaned[7])
        except ValueError:
            throughput = 0.0

        try:
            latency_ms = float(cleaned[6]) * 1000.0 if cleaned[6] != '-' else 0.0
        except ValueError:
            latency_ms = 0.0

        parsed.append(
            {
                'label': label,
                'send_rate': send_rate,
                'throughput': throughput,
                'latency_ms': latency_ms,
            }
        )

    return parsed


def plot_throughput(write_rows, read_rows, output_file: Path):
    write_sorted = sorted(write_rows, key=lambda x: x['send_rate'])
    read_sorted = sorted(read_rows, key=lambda x: x['send_rate'])

    x_write = [r['send_rate'] for r in write_sorted]
    y_write = [r['throughput'] for r in write_sorted]

    x_read = [r['send_rate'] for r in read_sorted]
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

    plt.title('Average Transaction Latency (Non-IoT / Non-TimescaleDB Functions)', fontsize=14, weight='bold')
    plt.ylabel('Average Transaction Latency (ms)', fontsize=12)
    plt.grid(axis='y', linestyle='--', alpha=0.4)
    plt.xticks(rotation=8)
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
        base / 'results' / 'throughput-write-report' / 'report.json',
        base / 'results' / 'throughput-write-report' / 'report',
        base / 'results' / 'throughput-write-report' / 'report.txt',
        base / 'results' / 'throughput-write-report.json'
    ])
    read_report = resolve_report([
        base / 'results' / 'throughput-read-report' / 'report.json',
        base / 'results' / 'throughput-read-report' / 'report',
        base / 'results' / 'throughput-read-report' / 'report.txt',
        base / 'results' / 'throughput-read-report.json'
    ])
    latency_report = resolve_report([
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

    plot_throughput(write_rows, read_rows, throughput_png)
    plot_latency(latency_rows, latency_png)

    print(f'Created: {throughput_png}')
    print(f'Created: {latency_png}')


if __name__ == '__main__':
    main()

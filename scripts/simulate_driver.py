#!/usr/bin/env python3
"""
Simula la App del repartidor enviando posiciones a /driver/location

Uso:
  python scripts\simulate_driver.py --backend https://... --order-id TEST-... \
    --driver-id D1 --steps 20 --interval 2

Opciones principales:
  --backend       URL del backend (ej: https://bottelegramihc-production.up.railway.app)
  --order-id      Id del pedido a simular (requerido a menos que use --create-order)
  --driver-id     Id del repartidor (por defecto: D1)
  --start-lat/lon Coordenadas iniciales (por defecto: plaza/restaurante)
  --end-lat/lon   Coordenadas destino (por defecto: cercano al restaurante)
  --steps         Número de actualizaciones intermedias (por defecto: 20)
  --interval      Segundos entre updates (por defecto: 2)
  --auto-status   Si se pasa, enviará update_status 'En camino' al inicio y 'Entregado' al final
  --create-order  (opcional) crear un pedido de prueba antes de simular (usa POST /submit_order)

El script usa `requests`. Instala con `pip install requests` si hace falta.
"""

import sys
import time
import argparse
import json
from math import fabs

try:
    import requests
except Exception:
    print("El paquete 'requests' no está instalado. Instálalo con: pip install requests")
    sys.exit(1)


def post_json(url, data, timeout=8):
    try:
        r = requests.post(url, json=data, timeout=timeout)
        try:
            return r.status_code, r.json()
        except Exception:
            return r.status_code, r.text
    except Exception as e:
        return None, str(e)


def put_json(url, data, timeout=8):
    try:
        r = requests.put(url, json=data, timeout=timeout)
        try:
            return r.status_code, r.json()
        except Exception:
            return r.status_code, r.text
    except Exception as e:
        return None, str(e)


def send_driver_location(backend, driver_id, lat, lon):
    url = backend.rstrip('/') + '/driver/location'
    payload = { 'driver_id': str(driver_id), 'latitude': float(lat), 'longitude': float(lon) }
    code, resp = post_json(url, payload)
    print(f"POST {url} -> code={code} resp={resp}")
    return code, resp


def update_order_status(backend, order_id, status):
    url = backend.rstrip('/') + f'/update_status/{order_id}'
    payload = { 'status': status }
    code, resp = post_json(url, payload)
    print(f"POST {url} -> code={code} resp={resp}")
    return code, resp


def create_test_order(backend, chat_id='LOCAL_TEST'):
    url = backend.rstrip('/') + '/submit_order'
    now_ts = int(time.time() * 1000)
    order = {
        'id': f'TEST-{now_ts}',
        'items': [ { 'id': 'pizza_margarita', 'name': 'Margarita', 'price': 35.0, 'quantity': 1 } ],
        'address': 'Simulación: Calle Prueba 1',
        'location': { 'latitude': -17.7833, 'longitude': -63.1821 },
        'paymentMethod': 'Efectivo',
        'date': time.strftime('%Y-%m-%dT%H:%M:%S'),
        'date_ts': now_ts,
        'channel': 'simulator',
        'currency': 'Bs',
        'status': 'Pendiente',
        'total': 35.0,
        'customer_name': 'Sim Driver',
        'customer_phone': '70011122'
    }
    payload = { 'chat_id': chat_id, 'order': order, 'notify_restaurant': True }
    code, resp = post_json(url, payload)
    print(f"Created test order -> code={code} resp={resp}")
    if isinstance(resp, dict) and resp.get('order_id'):
        return resp.get('order_id')
    return order['id']


def interp(a, b, t):
    return a + (b - a) * t


def main():
    p = argparse.ArgumentParser(description='Simula driver_location para un pedido')
    p.add_argument('--backend', required=True)
    p.add_argument('--order-id', default='')
    p.add_argument('--driver-id', default='D1')
    p.add_argument('--start-lat', type=float, default=-17.7836162)
    p.add_argument('--start-lon', type=float, default=-63.1814985)
    p.add_argument('--end-lat', type=float, default=-17.7833)
    p.add_argument('--end-lon', type=float, default=-63.1821)
    p.add_argument('--steps', type=int, default=20)
    p.add_argument('--interval', type=float, default=2.0)
    p.add_argument('--auto-status', action='store_true')
    p.add_argument('--create-order', action='store_true')
    args = p.parse_args()

    backend = args.backend
    order_id = args.order_id
    driver_id = args.driver_id

    if not order_id and not args.create_order:
        print('Debes pasar --order-id o usar --create-order para crear uno de prueba')
        sys.exit(1)

    if args.create_order:
        order_id = create_test_order(backend)
        print('Order created:', order_id)

    # marcar En camino si se solicita
    if args.auto_status:
        print('Setting status -> En camino')
        update_order_status(backend, order_id, 'En camino')

    start_lat = float(args.start_lat)
    start_lon = float(args.start_lon)
    end_lat = float(args.end_lat)
    end_lon = float(args.end_lon)
    steps = max(1, args.steps)
    interval = float(args.interval)

    print(f"Simulando driver {driver_id} en order {order_id} desde ({start_lat},{start_lon}) hasta ({end_lat},{end_lon}) en {steps} pasos cada {interval}s")

    try:
        for i in range(steps + 1):
            t = i / float(steps)
            lat = interp(start_lat, end_lat, t)
            lon = interp(start_lon, end_lon, t)
            send_driver_location(backend, driver_id, lat, lon)
            time.sleep(interval)

        if args.auto_status:
            print('Marcando pedido como Entregado')
            update_order_status(backend, order_id, 'Entregado')

        print('Simulación finalizada')

    except KeyboardInterrupt:
        print('Simulación interrumpida por el usuario')


if __name__ == '__main__':
    main()

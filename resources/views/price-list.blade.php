<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lista de Precios - La Bodeguita</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 40px;
            color: #333;
        }
        header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        h1 {
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 900;
        }
        .date {
            font-size: 0.9em;
            color: #666;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            text-align: left;
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
        }
        th {
            background-color: #f9f9f9;
            text-transform: uppercase;
            font-size: 0.8em;
            letter-spacing: 1px;
            font-weight: 700;
        }
        tr:nth-child(even) {
            background-color: #fafafa;
        }
        .price {
            font-family: 'Courier New', Courier, monospace;
            font-weight: 700;
            text-align: right;
            font-size: 1.1em;
        }
        .sku {
            color: #888;
            font-size: 0.85em;
            font-family: monospace;
        }
        @media print {
            body {
                padding: 0;
            }
            .no-print {
                display: none;
            }
            @page {
                margin: 2cm;
            }
        }
        .btn-print {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
    </style>
</head>
<body>
    <button class="btn-print no-print" onclick="window.print()">IMPRIMIR / PDF</button>

    <header>
        <h1>La Bodeguita</h1>
        <div class="date">Lista de Precios — {{ now()->format('d/m/Y H:i') }}</div>
    </header>

    <table>
        <thead>
            <tr>
                <th>Producto</th>
                <th>Código / SKU</th>
                <th style="text-align: right">Precio (COP)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($products as $product)
                <tr>
                    <td>
                        <div style="font-weight: 600">{{ $product->name }}</div>
                        @if($product->description)
                            <div style="font-size: 0.8em; color: #666; margin-top: 2px">{{ $product->description }}</div>
                        @endif
                    </td>
                    <td class="sku">{{ $product->sku ?? '---' }}</td>
                    <td class="price">{{ number_format(round($product->selling_price * $exchangeRate), 0, ',', '.') }} COP</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <footer style="margin-top: 50px; text-align: center; color: #999; font-size: 0.8em;">
        © {{ date('Y') }} La Bodeguita - Inventario en tiempo real
    </footer>
</body>
</html>

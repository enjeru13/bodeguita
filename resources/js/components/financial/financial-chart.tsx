import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ChartData {
    date: string;
    total_usd: number;
    total_cop: number;
}

interface Props {
    data: ChartData[];
}

export function FinancialChart({ data }: Props) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Formatear fechas para mostrar solo día y mes
    const formattedData = data.map((item) => ({
        ...item,
        displayDate: new Date(item.date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
        }),
    }));

    if (!isMounted) return (
        <Card className="h-[400px] w-full animate-pulse border-none bg-white shadow-xl dark:bg-zinc-900" />
    );

    return (
        <Card className="overflow-hidden border-none bg-white shadow-xl dark:bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-zinc-50/30 p-6 dark:bg-zinc-800/10">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-black tracking-tight">
                        Tendencia de Ventas
                    </CardTitle>
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                        Últimos 14 días de actividad
                    </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20">
                    <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="h-[300px] w-full overflow-hidden">
                    <ResponsiveContainer width="99%" height={300}>
                        <AreaChart
                            data={formattedData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#f0f0f0"
                                className="dark:stroke-zinc-800"
                            />
                            <XAxis
                                dataKey="displayDate"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    backdropFilter: 'blur(4px)',
                                }}
                                itemStyle={{
                                    fontSize: '12px',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                }}
                                labelStyle={{
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    color: '#6366f1',
                                    marginBottom: '4px',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="total_usd"
                                name="Ventas USD"
                                stroke="#6366f1"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorUsd)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6 flex items-center justify-around rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                    <div className="text-center">
                        <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Día más alto</p>
                        <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                            ${Math.max(...data.map(d => d.total_usd), 0).toFixed(2)}
                        </p>
                    </div>
                    <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
                    <div className="text-center">
                        <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Promedio diario</p>
                        <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                            ${(data.reduce((acc, curr) => acc + Number(curr.total_usd), 0) / (data.length || 1)).toFixed(2)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

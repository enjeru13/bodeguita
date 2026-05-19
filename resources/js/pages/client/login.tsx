import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, useForm } from '@inertiajs/react';
import { ShoppingBag, UserCheck } from 'lucide-react';

export default function ClientLogin() {
    const { data, setData, post, processing, errors } = useForm({
        identity_document: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/client/login');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
            <Head title="Portal del Cliente - Login" />

            <Card className="w-full max-w-md border-none shadow-2xl dark:bg-zinc-900">
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                        <ShoppingBag className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tight">
                        Mi Bodeguita
                    </CardTitle>
                    <CardDescription className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                        Portal del Cliente
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="identity_document"
                                className="ml-1 text-[10px] font-black tracking-widest text-muted-foreground uppercase"
                            >
                                Documento de Identidad / Cédula
                            </Label>
                            <div className="relative">
                                <UserCheck className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                                <Input
                                    id="identity_document"
                                    type="text"
                                    placeholder="Ej: 12345678"
                                    value={data.identity_document}
                                    onChange={(e) =>
                                        setData(
                                            'identity_document',
                                            e.target.value,
                                        )
                                    }
                                    className="h-14 rounded-2xl border-dashed bg-zinc-50 pl-11 text-lg font-bold focus:ring-indigo-500/30 dark:bg-zinc-800"
                                    required
                                />
                            </div>
                            {errors.identity_document && (
                                <p className="ml-1 text-[10px] font-bold text-red-500 uppercase italic">
                                    {errors.identity_document}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="h-14 w-full rounded-2xl bg-indigo-600 text-lg font-black tracking-widest text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-indigo-700 active:scale-95"
                            disabled={processing}
                        >
                            {processing ? 'ENTRANDO...' : 'ENTRAR A MI CUENTA'}
                        </Button>

                        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase opacity-50">
                            Ingresa tu cédula para ver deudas y compras
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

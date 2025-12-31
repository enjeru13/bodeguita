import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { Form, Head } from '@inertiajs/react';
import { Lock, LogIn, Mail } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({
    status,
    canRegister,
}: LoginProps) {
    return (
        <AuthLayout
            title="Bienvenido de Nuevo"
            description="Ingresa tus credenciales para acceder al panel de control"
        >
            <Head title="Iniciar Sesión" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    Correo Electrónico
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="admin@empresa.com"
                                        className="pl-9" // Espacio para el icono
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Contraseña</Label>
                                    
                                </div>
                                <div className="relative">
                                    <Lock className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        className="pl-9"
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="border-zinc-300 data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="cursor-pointer font-normal text-muted-foreground"
                                >
                                    Mantener sesión iniciada
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full bg-indigo-600 font-bold tracking-wide hover:bg-indigo-700"
                                tabIndex={4}
                                disabled={processing}
                            >
                                {processing && <Spinner className="mr-2" />}
                                {!processing && (
                                    <LogIn className="mr-2 h-4 w-4" />
                                )}
                                Iniciar Sesión
                            </Button>
                        </div>

                        {canRegister && (
                            <div className="mt-4 text-center text-sm text-muted-foreground">
                                ¿No tienes cuenta?{' '}
                                <TextLink
                                    href={register()}
                                    tabIndex={5}
                                    className="font-bold text-indigo-600 underline-offset-4 hover:underline"
                                >
                                    Registrar nueva cuenta
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}

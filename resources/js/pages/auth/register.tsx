import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head } from '@inertiajs/react';
import { Lock, Mail, User, UserPlus } from 'lucide-react';

export default function Register() {
    return (
        <AuthLayout
            title="Crear Cuenta"
            description="Registra un nuevo usuario administrador para el sistema"
        >
            <Head title="Registro" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            {/* Nombre Completo */}
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <div className="relative">
                                    <User className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        type="text"
                                        name="name"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="name"
                                        placeholder="Ej. Juan Pérez"
                                        className="pl-9"
                                    />
                                </div>
                                <InputError message={errors.name} />
                            </div>

                            {/* Correo Electrónico */}
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
                                        tabIndex={2}
                                        autoComplete="email"
                                        placeholder="admin@empresa.com"
                                        className="pl-9"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            {/* Contraseña */}
                            <div className="grid gap-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        required
                                        tabIndex={3}
                                        autoComplete="new-password"
                                        placeholder="Mínimo 8 caracteres"
                                        className="pl-9"
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            {/* Confirmar Contraseña */}
                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirmar Contraseña
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        required
                                        tabIndex={4}
                                        autoComplete="new-password"
                                        placeholder="Repite la contraseña"
                                        className="pl-9"
                                    />
                                </div>
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full bg-indigo-600 font-bold tracking-wide hover:bg-indigo-700"
                                tabIndex={5}
                                disabled={processing}
                            >
                                {processing && <Spinner className="mr-2" />}
                                {!processing && (
                                    <UserPlus className="mr-2 h-4 w-4" />
                                )}
                                Registrarse
                            </Button>
                        </div>

                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            ¿Ya tienes una cuenta?{' '}
                            <TextLink
                                href={login()}
                                tabIndex={6}
                                className="font-bold text-indigo-600 underline-offset-4 hover:underline"
                            >
                                Iniciar Sesión
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}

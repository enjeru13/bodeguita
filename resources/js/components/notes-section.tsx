import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { router, useForm } from '@inertiajs/react';
import { Edit2, Pin, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
}

interface Note {
    id: number;
    content: string;
    color: string;
    is_pinned: boolean;
    created_at: string;
    user: User;
}

interface NotesSectionProps {
    notes: Note[];
}

const COLORS = [
    { id: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-800 dark:text-yellow-200' },
    { id: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-200' },
    { id: 'green', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-200' },
    { id: 'pink', bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-200 dark:border-pink-800', text: 'text-pink-800 dark:text-pink-200' },
    { id: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-800 dark:text-purple-200' },
    { id: 'orange', bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-800 dark:text-orange-200' },
    { id: 'red', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-200' },
    { id: 'teal', bg: 'bg-teal-100 dark:bg-teal-900/30', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-800 dark:text-teal-200' },
    { id: 'indigo', bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-800 dark:text-indigo-200' },
];

export default function NotesSection({ notes }: NotesSectionProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState({ content: '', color: 'yellow' });
    const { data, setData, post, processing, reset } = useForm({
        content: '',
        color: 'yellow',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/notes', {
            onSuccess: () => {
                setIsAdding(false);
                reset();
            },
        });
    };

    const togglePin = (note: Note) => {
        router.put(`/notes/${note.id}`, {
            is_pinned: !note.is_pinned,
        });
    };

    const deleteNote = (id: number) => {
        if (confirm('¿Estás seguro de eliminar esta nota?')) {
            router.delete(`/notes/${id}`);
        }
    };

    const startEditing = (note: Note) => {
        setEditingId(note.id);
        setEditData({ content: note.content, color: note.color });
    };

    const cancelEditing = () => {
        setEditingId(null);
    };

    const saveEdit = (note: Note) => {
        if (!editData.content.trim()) return;
        router.put(`/notes/${note.id}`, {
            content: editData.content,
            color: editData.color,
        }, {
            onSuccess: () => setEditingId(null),
            preserveScroll: true
        });
    };

    return (
        <Card className="border-none bg-white shadow-xl dark:bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-2">
                <div>
                    <CardTitle className="text-xl font-black tracking-tight">
                        Pizarrón de Notas
                    </CardTitle>
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                        Recordatorios y avisos del equipo
                    </p>
                </div>
                {!isAdding ? (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAdding(true)}
                        className="h-8 gap-1 text-[10px] font-black uppercase tracking-widest"
                    >
                        <Plus className="h-3 w-3" /> Nueva Nota
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAdding(false)}
                        className="h-8 gap-1 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600"
                    >
                        <X className="h-3 w-3" /> Cancelar
                    </Button>
                )}
            </CardHeader>
            <CardContent className="p-6">
                {isAdding && (
                    <form onSubmit={handleSubmit} className="mb-8 space-y-4 rounded-xl border-2 border-dashed border-zinc-200 p-4 dark:border-zinc-800">
                        <Textarea
                            placeholder="Escribe algo importante..."
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                            className="min-h-[100px] border-none bg-zinc-50 focus-visible:ring-0 dark:bg-zinc-800/50"
                            required
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2 max-w-[60%]">
                                {COLORS.map((color) => (
                                    <button
                                        key={color.id}
                                        type="button"
                                        onClick={() => setData('color', color.id)}
                                        className={`h-6 w-6 shrink-0 rounded-full border-2 transition-transform hover:scale-110 ${color.bg} ${
                                            data.color === color.id ? 'border-zinc-900 dark:border-white' : 'border-transparent'
                                        }`}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-[10px] font-bold ${data.content.length > 1000 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                    {data.content.length} / 1000
                                </span>
                                <Button disabled={processing || data.content.length > 1000} type="submit" size="sm" className="font-black uppercase tracking-widest">
                                    Guardar Nota
                                </Button>
                            </div>
                        </div>
                    </form>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {notes.map((note) => {
                        const colorStyle = COLORS.find((c) => c.id === note.color) || COLORS[0];
                        return (
                            <div
                                key={note.id}
                                className={`group relative flex flex-col justify-between rounded-2xl border-l-4 p-4 shadow-sm transition-all hover:shadow-md ${colorStyle.bg} ${colorStyle.border} ${
                                    note.is_pinned ? 'scale-[1.02] shadow-md' : ''
                                }`}
                            >
                                {editingId === note.id ? (
                                    <div className="flex flex-col gap-3 mb-4">
                                        <Textarea
                                            value={editData.content}
                                            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                                            className="min-h-[100px] border-none bg-white/50 focus-visible:ring-0 dark:bg-black/20"
                                            autoFocus
                                        />
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-1.5 flex-wrap max-w-[50%]">
                                                {COLORS.map((color) => (
                                                    <button
                                                        key={color.id}
                                                        type="button"
                                                        onClick={() => setEditData({ ...editData, color: color.id })}
                                                        className={`h-5 w-5 shrink-0 rounded-full border-2 transition-transform hover:scale-110 ${color.bg} ${
                                                            editData.color === color.id ? 'border-zinc-900 dark:border-white' : 'border-transparent'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                <span className={`text-[9px] font-bold ${editData.content.length > 1000 ? 'text-red-500' : 'text-zinc-500'}`}>
                                                    {editData.content.length} / 1000
                                                </span>
                                                <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-7 px-2 text-[10px] uppercase">Cancelar</Button>
                                                <Button size="sm" onClick={() => saveEdit(note)} disabled={editData.content.length > 1000} className="h-7 px-2 text-[10px] uppercase">Guardar</Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-800 dark:text-zinc-200">
                                            {note.content}
                                        </div>
                                        <div className="flex items-center justify-between border-t border-zinc-900/10 pt-3 dark:border-white/10">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400">
                                                    {note.user.name}
                                                </span>
                                                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500">
                                                    {new Date(note.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                <button
                                                    onClick={() => startEditing(note)}
                                                    className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/20"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => togglePin(note)}
                                                    className={`rounded-md p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                                                        note.is_pinned ? 'text-blue-600' : 'text-zinc-400'
                                                    }`}
                                                    title={note.is_pinned ? 'Desfijar' : 'Fijar nota'}
                                                >
                                                    <Pin className={`h-3.5 w-3.5 ${note.is_pinned ? 'fill-current' : ''}`} />
                                                </button>
                                                <button
                                                    onClick={() => deleteNote(note.id)}
                                                    className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        {note.is_pinned && (
                                            <div className="absolute -top-2 -right-2 rounded-full bg-blue-600 p-1 text-white shadow-lg">
                                                <Pin className="h-3 w-3 fill-current" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                    {notes.length === 0 && !isAdding && (
                        <div className="col-span-full py-12 text-center">
                            <p className="text-sm text-muted-foreground italic">
                                No hay notas por ahora. ¡Añade una para empezar!
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


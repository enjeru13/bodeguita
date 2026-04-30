<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NoteController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:1000',
            'color' => 'nullable|string|in:yellow,blue,green,pink,purple',
        ]);

        Note::create([
            'content' => $validated['content'],
            'color' => $validated['color'] ?? 'yellow',
            'user_id' => Auth::id(),
            'is_pinned' => false,
        ]);

        return back()->with('success', 'Nota creada correctamente.');
    }

    public function update(Request $request, Note $note)
    {
        $validated = $request->validate([
            'content' => 'nullable|string|max:1000',
            'color' => 'nullable|string|in:yellow,blue,green,pink,purple',
            'is_pinned' => 'nullable|boolean',
        ]);

        $note->update($validated);

        return back()->with('success', 'Nota actualizada.');
    }

    public function destroy(Note $note)
    {
        $note->delete();

        return back()->with('success', 'Nota eliminada.');
    }
}

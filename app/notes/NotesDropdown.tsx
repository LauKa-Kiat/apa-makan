"use client";
import { useState } from "react";

type Note = {
  name: string;
  shops: string[]; // Adjust type as needed
};

const randomShop = (shops: string[]) => {
  if (shops.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * shops.length);
  return shops[randomIndex];
};

export default function NotesDropdown({ notes }: { notes: Note[] }) {
  const [location, setLocation] = useState<string>(notes[0]?.name || "");
  const selectedNote = notes.find((note) => note.name === location);

  return (
    <div className="flex flex-col">
      <select
        onChange={(e) => setLocation(e.target.value)}
        value={location}
        className="mb-4 p-2 rounded"
      >
        {notes.map((note) => (
          <option key={note.name} value={note.name}>
            {note.name}
          </option>
        ))}
      </select>
      {selectedNote && selectedNote.shops && (
        <div>
          <h3 className="text-white font-bold mb-2">Shops:</h3>
          <div className="flex flex-row gap-2 overflow-x-scroll text-white">
            {selectedNote.shops.map((shop: string, idx: number) => (
              <div
                key={idx}
                className="rounded bg-slate-600 p-2 min-w-fit h-fit text-nowrap"
              >
                {shop}
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedNote && selectedNote.shops && (
        <button
          className="m-4 p-2 bg-blue-500 text-white rounded place-self-center"
          onClick={() => {
            const shop = randomShop(selectedNote.shops);
            if (shop) {
              alert(`Random Shop: ${shop}`);
            }
          }}
        >
          Randomise
        </button>
      )}
    </div>
  );
}

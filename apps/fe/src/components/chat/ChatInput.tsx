import { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({onSend, disabled = false}: ChatInputProps) {
  const [value, setValue] = useState("");

  function handleSend() {
    const message = value.trim();

    if (!message) {
      return;
    }

    onSend(message);
    setValue("");
  }

  return (
    <div className="border-t p-4 flex gap-2 shrink-0">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 border rounded-lg px-4 py-2 outline-none"
      />

      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="border rounded-lg px-5 py-2 disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}

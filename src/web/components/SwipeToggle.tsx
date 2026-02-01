import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export function SwipeToggle({
    value,
    disabled,
    onChange,
}: {
    value: boolean;
    disabled?: boolean;
    onChange: (next: boolean) => void;
}) {
    const trackRef = useRef<HTMLDivElement | null>(null);
    const knobRef = useRef<HTMLDivElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [dragX, setDragX] = useState(0);
    const maxRef = useRef(0);

    useEffect(() => {
        const update = () => {
            if (!trackRef.current || !knobRef.current) return;
            maxRef.current = Math.max(
                0,
                trackRef.current.clientWidth - knobRef.current.clientWidth - 12
            );
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const clamp = (x: number) => Math.max(0, Math.min(x, maxRef.current));

    const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (disabled) return;
        const track = trackRef.current;
        const knob = knobRef.current;
        if (!track || !knob) return;
        setDragging(true);
        (e.target as Element).setPointerCapture?.(e.pointerId);
        const rect = track.getBoundingClientRect();
        const next = clamp(e.clientX - rect.left - knob.clientWidth / 2);
        setDragX(next);
    };

    const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!dragging) return;
        const track = trackRef.current;
        const knob = knobRef.current;
        if (!track || !knob) return;
        const rect = track.getBoundingClientRect();
        const next = clamp(e.clientX - rect.left - knob.clientWidth / 2);
        setDragX(next);
    };

    const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!dragging) return;
        setDragging(false);
        (e.target as Element).releasePointerCapture?.(e.pointerId);
        const nextValue = dragX > maxRef.current / 2;
        setDragX(0);
        if (nextValue !== value) onChange(nextValue);
    };

    const handleClick = () => {
        if (disabled || dragging) return;
        onChange(!value);
    };

    const currentX = dragging ? dragX : value ? maxRef.current : 0;

    return (
        <div
            className={`toggle ${value ? "on" : "off"} ${disabled ? "disabled" : ""}`}
            onClick={handleClick}
        >
            <div
                className="toggle-track"
                ref={trackRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <div
                    className="toggle-knob"
                    ref={knobRef}
                    style={{ transform: `translateX(${currentX}px)` }}
                >
                    {value ? "ON" : "OFF"}
                </div>
            </div>
        </div>
    );
}

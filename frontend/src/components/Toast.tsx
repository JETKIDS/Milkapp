import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

interface ToastItem { id: number; kind: ToastKind; message: string; timeoutId?: ReturnType<typeof setTimeout> }
interface ToastContextValue { notify: (kind: ToastKind, message: string, opts?: { duration?: number }) => void }

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface ProviderProps {
	children: ReactNode;
	position?: Position;
	duration?: number; // ms
	max?: number; // 最大同時表示数
}

const ToastContext = createContext<ToastContextValue>({ notify: () => {} });

export function ToastProvider({ children, position = 'bottom-right', duration = 3000, max = 4 }: ProviderProps) {
	const [items, setItems] = useState<ToastItem[]>([]);

	const remove = (id: number) => setItems(prev => prev.filter(x => x.id !== id));

	const notify = (kind: ToastKind, message: string, opts?: { duration?: number }) => {
		const id = Date.now() + Math.random();
		setItems(prev => {
			const next = [...prev, { id, kind, message }];
			// スタック上限を超える場合は古いものから削除
			while (next.length > max) next.shift();
			return next;
		});
		const timeout = setTimeout(() => remove(id), opts?.duration ?? duration);
		// timeoutIdを格納（明示closeに備える）
		setItems(prev => prev.map(x => (x.id === id ? { ...x, timeoutId: timeout } : x)));
	};

	const posStyle = useMemo(() => {
		const base: React.CSSProperties = { position: 'fixed', display: 'grid', gap: 8, zIndex: 60 };
		switch (position) {
			case 'top-left': return { ...base, left: 16, top: 16 } as const;
			case 'top-right': return { ...base, right: 16, top: 16 } as const;
			case 'bottom-left': return { ...base, left: 16, bottom: 16 } as const;
			default: return { ...base, right: 16, bottom: 16 } as const;
		}
	}, [position]);

	return (
		<ToastContext.Provider value={{ notify }}>
			{children}
			<div style={posStyle}>
				{items.map(t => (
					<div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, color: '#fff', background: t.kind === 'success' ? '#16a34a' : t.kind === 'error' ? '#dc2626' : '#0ea5e9', boxShadow: '0 6px 24px rgba(0,0,0,.15)' }}>
						<span>{t.message}</span>
						<button className="ghost" onClick={() => { if (t.timeoutId) clearTimeout(t.timeoutId); remove(t.id); }}>×</button>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() { return useContext(ToastContext); }



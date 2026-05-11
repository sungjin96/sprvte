import { ReactNode } from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Mascot background — low opacity */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="opacity-[0.04]" style={{ width: 480, height: 480 }}>
          <Image
            src="/assets/mascot-full.svg"
            alt=""
            width={480}
            height={480}
            priority
          />
        </div>
      </div>

      {/* Radial glow behind card */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,229,160,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[400px]">{children}</div>
    </div>
  );
}

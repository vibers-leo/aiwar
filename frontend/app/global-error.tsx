'use client';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="ko">
      <body style={{ background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>오류가 발생했어요</h2>
          <button
            onClick={() => reset()}
            style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}

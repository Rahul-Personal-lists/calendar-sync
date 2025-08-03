export default function SimplePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#059669', marginBottom: '1rem' }}>✅ Simple Page Working!</h1>
        <p style={{ color: '#374151', marginBottom: '1rem' }}>
          This is a basic page without any external dependencies.
        </p>
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '1rem',
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
          fontFamily: 'monospace',
          textAlign: 'left'
        }}>
          <p><strong>Build Info:</strong></p>
          <p>Node Environment: {process.env.NODE_ENV}</p>
          <p>Build Time: {new Date().toISOString()}</p>
        </div>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.25rem'
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  );
} 
/**
 * Not Found (404) Page
 *
 * Displayed when user navigates to a non-existent route.
 * Provides a friendly message and navigation options.
 */

import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page-container">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <div
          style={{
            fontSize: '5rem',
            fontWeight: 'bold',
            color: '#e74c3c',
            marginBottom: '1rem',
          }}
        >
          404
        </div>

        <h1
          style={{
            fontSize: '2.5rem',
            marginBottom: '0.5rem',
            color: '#2c3e50',
          }}
        >
          الصفحة غير موجودة
        </h1>

        <p
          style={{
            fontSize: '1.2rem',
            color: '#7f8c8d',
            marginBottom: '2rem',
            lineHeight: '1.6',
          }}
        >
          عذراً، الصفحة التي تبحث عنها غير موجودة أو قد تم حذفها.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Link
            to="/events"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3498db',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              transition: 'background-color 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2980b9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3498db')}
          >
            العودة إلى المناسبات
          </Link>

          <button
            onClick={() => window.history.back()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7f8c8d')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#95a5a6')}
          >
            الرجوع للخلف
          </button>
        </div>
      </div>
    </div>
  );
}

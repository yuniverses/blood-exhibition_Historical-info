export default function SimpleExhibition() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '20px', color: '#333' }}>
        血液展覽系統
      </h1>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#666' }}>
          目前沒有展示內容
        </h2>
        <p style={{ marginBottom: '20px', color: '#888' }}>
          請先前往管理介面新增區塊和卡片
        </p>
        <a
          href="/admin"
          style={{
            display: 'inline-block',
            padding: '12px 30px',
            backgroundColor: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            fontWeight: 'bold'
          }}
        >
          前往管理介面
        </a>
      </div>
      <div style={{ marginTop: '20px' }}>
        <a href="/test" style={{ color: '#3b82f6', marginRight: '20px' }}>測試頁面</a>
        <span style={{ color: '#999' }}>系統版本 1.0</span>
      </div>
    </div>
  );
}

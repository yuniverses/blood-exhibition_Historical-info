import { useState, useEffect } from 'react';

export default function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // 更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 格式化日期
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year} - ${month} - ${day}`;
  };

  // 計算時鐘指針角度
  const getClockAngles = (date: Date) => {
    const hours = date.getHours() % 12;
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    return {
      hour: (hours * 30) + (minutes * 0.5), // 每小時 30 度，每分鐘 0.5 度
      minute: minutes * 6, // 每分鐘 6 度
      second: seconds * 6, // 每秒 6 度
    };
  };

  const angles = getClockAngles(currentTime);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="flex items-start justify-between p-5 max-w-screen-xl mx-auto">
        {/* Left: Title section */}
        <div className="flex flex-col gap-1.5 pointer-events-auto" style={{ width: 'min(45%, 18rem)' }}>
          {/* Title and decorative dates */}
          <div className="flex items-start justify-between">
            <h1
              className="font-bold leading-tight"
              style={{
                fontFamily: "'Noto Sans TC', sans-serif",
                color: '#b0a6a6',
                fontSize: 'clamp(1.2rem, 3.5vw, 1.6rem)'
              }}
            >
              史料查詢機
            </h1>

            {/* Decorative dates - stacked vertically */}
            <div className="flex flex-col items-end gap-0.5 text-right">
              <p
                className="whitespace-nowrap leading-tight"
                style={{
                  fontFamily: "'Noto Sans TC', sans-serif",
                  color: '#f3f3f3',
                  fontSize: '0.5rem',
                }}
              >
                {formatDate(currentTime)}
              </p>
              <p
                className="whitespace-nowrap leading-tight"
                style={{
                  fontFamily: "'Noto Sans TC', sans-serif",
                  color: '#f3f3f3',
                  fontSize: '0.5rem',
                }}
              >
                1990
              </p>
            </div>
          </div>

          {/* Divider line */}
          <div
            className="w-full border-t border-dotted"
            style={{ borderColor: '#b0a6a6' }}
          />

          {/* Subtitle */}
          <p
            className="font-bold leading-tight"
            style={{
              fontFamily: "'Noto Sans TC', sans-serif",
              color: '#b0a6a6',
              fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)'
            }}
          >
            醫療財團法人台灣血液基金會
          </p>
        </div>

        {/* Right: Clock */}
        <div
          className="relative pointer-events-auto"
          style={{
            width: 'clamp(2.5rem, 8vw, 3.25rem)',
            height: 'clamp(2.5rem, 8vw, 3.25rem)'
          }}
        >
          {/* Clock circle */}
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: '#b0a6a6' }}
          />

          {/* Clock center dot */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              backgroundColor: '#b0a6a6',
              width: '0.25rem',
              height: '0.25rem'
            }}
          />

          {/* Hour hand */}
          <div
            className="absolute left-1/2 origin-bottom"
            style={{
              bottom: '50%',
              width: '0.15rem',
              height: '25%',
              backgroundColor: '#b0a6a6',
              transform: `translateX(-50%) rotate(${angles.hour}deg)`,
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />

          {/* Minute hand */}
          <div
            className="absolute left-1/2 origin-bottom"
            style={{
              bottom: '50%',
              width: '0.1rem',
              height: '35%',
              backgroundColor: '#b0a6a6',
              transform: `translateX(-50%) rotate(${angles.minute}deg)`,
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />

          {/* Second hand */}
          <div
            className="absolute left-1/2 origin-bottom"
            style={{
              bottom: '50%',
              width: '0.05rem',
              height: '38%',
              backgroundColor: '#f3f3f3',
              transform: `translateX(-50%) rotate(${angles.second}deg)`,
              transition: 'transform 0.1s linear',
            }}
          />
        </div>
      </div>
    </div>
  );
}

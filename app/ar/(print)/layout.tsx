// Minimal print layout - no header/footer
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            background: #fff;
          }
          
          @page {
            size: A4;
            margin: 10mm;
          }
          
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </head>
      <body className="bg-white text-black m-0 p-0">
        {children}
      </body>
    </html>
  );
}

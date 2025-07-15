import React, {useState} from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function DocumentViewer({url}) {
    const [numPages, setNumPages] = useState(0);


function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
}

return(
    <div className="bg-white dark:bg-neutral p-4 rounded-lg max-w-full max-h-[80vh] overflow-auto">
      <Document file={url} onLoadSuccess={onDocumentLoadSuccess}>
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={`page_${i+1}`}
            pageNumber={i + 1}
            width={800}               // adjust to fit your modal width
          />
        ))}
      </Document>
    </div>
    ); 
}
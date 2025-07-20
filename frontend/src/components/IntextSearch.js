import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { PDFFindController, EventBus } from 'pdfjs-dist/web/pdf_viewer';

// Set worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function IntextSearch({ file }) {
  const [numPages, setNumPages] = useState(null);
  const [pdfInstance, setPdfInstance] = useState(null);
  const [query, setQuery] = useState('');
  const eventBusRef = useRef();
  const findControllerRef = useRef();

  const viewerContainerRef = useRef();

  useEffect(() => {
    eventBusRef.current = new EventBus();

    findControllerRef.current = new PDFFindController({
      eventBus: eventBusRef.current,
    });
  }, []);

  function onDocumentLoadSuccess(pdf) {
    setNumPages(pdf.numPages);
    setPdfInstance(pdf);

    // Wire up controller to PDFDocument
    findControllerRef.current.setDocument(pdf);
  }

  const handleSearch = () => {
    if (!findControllerRef.current || !query) return;

    findControllerRef.current.executeCommand('find', {
      query,
      highlightAll: true,
      caseSensitive: false,
      entireWord: false,
      findPrevious: false,
    });
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-neutral-800 h-full">
      <div className="flex mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search in document…"
          className="border p-2 flex-1"
        />
        <button
          onClick={handleSearch}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Find
        </button>
      </div>

      <div ref={viewerContainerRef} className="overflow-auto border h-[80vh]">
        <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={800}
              renderTextLayer={true}
              renderAnnotationLayer={false}
            />
          ))}
        </Document>
      </div>
    </div>
  );
}

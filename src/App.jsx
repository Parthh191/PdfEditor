import { useState, useRef, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { FaEraser, FaFont, FaMagic } from 'react-icons/fa';
import { BsEyeFill, BsStars } from 'react-icons/bs';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import PdfCanvas from './components/PdfCanvas';

// Initialize PDF.js worker
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTool, setCurrentTool] = useState(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [error, setError] = useState(null);
  const [isFileHovered, setIsFileHovered] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const containerRef = useRef(null);
  const pageRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Show welcome toast only once
    if (!hasShownWelcome) {
      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-[#0a0a0a] text-white p-4 rounded-xl shadow-xl border border-[rgba(255,255,255,0.05)] flex items-center gap-3"
        >
          <BsStars className="text-white text-xl animate-pulse" />
          <div>
            <p className="font-medium">Welcome to PDF Pro Editor</p>
            <p className="text-gray-400">Edit your PDFs with style ✨</p>
          </div>
        </motion.div>
      ), { duration: 4000 });
      setHasShownWelcome(true);
    }
  }, [hasShownWelcome]);

  useEffect(() => {
    if (pageRef.current && pageDimensions.width > 0) {
      const { width, height } = pageRef.current.getBoundingClientRect();
      setPageDimensions(prev => ({
        ...prev,
        scale: width / prev.width
      }));
    }
  }, [pageDimensions.width]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = function(e) {
        // Clear any previous state
        setCurrentPage(1);
        setError(null);
        setCurrentTool(null);
        setPageDimensions({ width: 0, height: 0, scale: 1 });
        setPdfFile(e.target.result);
      };
      reader.onerror = function(e) {
        console.error('Error reading file:', e);
        toast.error('Error reading PDF file');
        setError('Error reading PDF file');
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Please upload a valid PDF file');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setError(null);
    toast.success('PDF loaded successfully!');
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try a different file.');
    toast.error('Failed to load PDF file');
  };

  const handlePageLoadSuccess = (page) => {
    const viewport = page.getViewport({ scale: 1 });
    setPageDimensions({
      width: viewport.width,
      height: viewport.height,
      scale: 1
    });
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Modern Header Design */}
        <header className="flex justify-between items-center mb-8 gradient-card rounded-2xl p-8 relative overflow-hidden">
          <div className="flex items-center gap-6 relative z-10">
            <div className="text-5xl filter drop-shadow-lg">📄</div>
            <div>
              <h1 className="text-4xl font-bold gradient-heading-primary mb-1">
                PDF Pro Editor
              </h1>
              <p className="gradient-heading-accent text-lg">
                Professional Edition
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowParticles(!showParticles)}
            className="gradient-button p-4 rounded-xl hover-lift relative"
          >
            <FaMagic className="text-white text-xl" />
          </button>
          
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-30 mix-blend-overlay">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#22d3ee] to-transparent rounded-full filter blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-gradient-to-tr from-[#818cf8] to-transparent rounded-full filter blur-3xl"></div>
          </div>
        </header>

        {/* Tools section with enhanced design */}
        <div className="gradient-card rounded-2xl p-8 mb-8 relative overflow-hidden">
          <h2 className="gradient-heading-secondary text-2xl font-semibold mb-6">Tools</h2>
          <div className="flex flex-wrap gap-4 relative z-10">
            {['blur', 'erase', 'text'].map((tool) => (
              <button
                key={tool}
                onClick={() => setCurrentTool(t => t === tool ? null : tool)}
                className={`
                  px-8 py-4 rounded-xl font-medium transition-all duration-300
                  ${currentTool === tool 
                    ? 'tool-active gradient-button shadow-lg shadow-cyan-500/20' 
                    : 'bg-slate-800/50 hover:bg-slate-700/50 text-gray-100 border border-slate-700/50'
                  }
                  backdrop-blur-sm hover:scale-105 transform hover:-translate-y-0.5
                `}
              >
                <span className="flex items-center gap-2">
                  {tool === 'blur' && <FaMagic className="text-lg" />}
                  {tool === 'erase' && <FaEraser className="text-lg" />}
                  {tool === 'text' && <FaFont className="text-lg" />}
                  {tool.charAt(0).toUpperCase() + tool.slice(1)}
                </span>
              </button>
            ))}
          </div>
          
          {/* Decorative background */}
          <div className="absolute inset-0 opacity-20 mix-blend-overlay">
            <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-bl from-[#22d3ee] to-transparent rounded-full filter blur-3xl"></div>
            <div className="absolute left-0 bottom-0 w-48 h-48 bg-gradient-to-tr from-[#818cf8] to-transparent rounded-full filter blur-3xl"></div>
          </div>
        </div>

        {/* Main content area with enhanced drop zone */}
        <div className="w-full min-h-[60vh]">
          {!pdfFile ? (
            <div className="gradient-card rounded-2xl p-16 text-center relative overflow-hidden group">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer block relative z-10"
              >
                <div className="text-8xl mb-8 transition-transform duration-500 transform group-hover:scale-110 group-hover:-rotate-3">
                  📄
                </div>
                <h3 className="text-3xl mb-4 font-bold gradient-heading-primary">
                  Drop your PDF here
                </h3>
                <p className="gradient-heading-accent text-lg">
                  or click to browse files
                </p>
              </label>
              
              {/* Decorative elements for drop zone */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-gradient-to-br from-[#22d3ee] via-transparent to-[#818cf8] opacity-30 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="absolute inset-0 backdrop-blur-[2px]"></div>
              </div>
            </div>
          ) : (
            <div className="gradient-card rounded-2xl p-8 relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="gradient-heading-secondary text-2xl font-semibold flex items-center gap-3">
                  <BsEyeFill className="text-2xl" />
                  PDF Viewer
                </h2>
              </div>
              <div className="flex justify-center">
                <div className="relative inline-block" style={{ touchAction: 'none' }}>
                  <Document
                    file={pdfFile}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex justify-center items-center p-8">
                        <div className="w-12 h-12 border-4 border-[#2a2a2a] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    }
                    error={
                      <div className="text-gray-400 text-center p-8 bg-[#1a1a1a]/20 rounded-xl">
                        <div className="text-3xl mb-2">⚠️</div>
                        {error || 'Failed to load PDF'}
                      </div>
                    }
                  >
                    <div ref={pageRef} className="shadow-2xl rounded-xl overflow-hidden">
                      <Page
                        pageNumber={currentPage}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        onLoadSuccess={handlePageLoadSuccess}
                        loading={
                          <div className="flex justify-center items-center p-8">
                            <div className="w-12 h-12 border-4 border-[#2a2a2a] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        }
                      />
                      {pageDimensions.width > 0 && !error && (
                        <div 
                          className="absolute top-0 left-0 w-full h-full" 
                          style={{ 
                            pointerEvents: currentTool ? 'auto' : 'none',
                            cursor: currentTool ? 'crosshair' : 'default'
                          }}
                        >
                          <PdfCanvas
                            ref={canvasRef}
                            tool={currentTool}
                            pageWidth={pageDimensions.width}
                            pageHeight={pageDimensions.height}
                            scale={pageDimensions.scale || 1}
                          />
                        </div>
                      )}
                    </div>
                  </Document>
                </div>
              </div>
              
              {/* Page Navigation */}
              {numPages > 1 && !error && (
                <div className="flex justify-center items-center mt-6 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage <= 1}
                    className="gradient-button px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Previous
                  </motion.button>
                  <span className="gradient-heading-secondary font-medium px-4">
                    Page {currentPage} of {numPages}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentPage(page => Math.min(numPages, page + 1))}
                    disabled={currentPage >= numPages}
                    className="gradient-button px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Next
                  </motion.button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced toast styling */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
            color: '#FFFFFF',
            borderRadius: '1rem',
            padding: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
          },
        }}
      />
    </div>
  );
}

export default App;

import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ImageCompressor   from './pages/tools/ImageCompressor'
import ImageResize       from './pages/tools/ImageResize'
import ImageConvert      from './pages/tools/ImageConvert'
import PdfMerge          from './pages/tools/PdfMerge'
import PdfSplit          from './pages/tools/PdfSplit'
import PdfCompress       from './pages/tools/PdfCompress'
import PdfToWord         from './pages/tools/PdfToWord'
import JpgToPdf          from './pages/tools/JpgToPdf'
import WordCounter       from './pages/tools/WordCounter'
import CaseConverter     from './pages/tools/CaseConverter'
import JsonFormatter     from './pages/tools/JsonFormatter'
import PasswordGenerator from './pages/tools/PasswordGenerator'
import UuidGenerator     from './pages/tools/UuidGenerator'
import NotFound          from './pages/NotFound'
import PdfWatermark       from './pages/tools/PdfWatermark'
import PdfRemoveWatermark from './pages/tools/PdfRemoveWatermark'
import PdfProtect         from './pages/tools/PdfProtect'
import PdfUnlock          from './pages/tools/PdfUnlock'
import PdfPageNumbers     from './pages/tools/PdfPageNumbers'
import QrCodeGenerator    from './pages/tools/QrCodeGenerator'
import ImageToText        from './pages/tools/ImageToText'
import PdfToText          from './pages/tools/PdfToText'
import BackgroundRemover  from './pages/tools/BackgroundRemover'
import ResumeAtsChecker   from './pages/tools/ResumeAtsChecker'
import PdfToJpg           from './pages/tools/PdfToJpg'
import WordToPdf          from './pages/tools/WordToPdf'
import RepairPdf          from './pages/tools/RepairPdf'
import RemovePdfPages     from './pages/tools/RemovePdfPages'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"                              element={<Home />} />
          <Route path="/tools/compress-image"          element={<ImageCompressor />} />
          <Route path="/tools/resize-image"            element={<ImageResize />} />
          <Route path="/tools/convert-image"           element={<ImageConvert />} />
          <Route path="/tools/merge-pdf"               element={<PdfMerge />} />
          <Route path="/tools/split-pdf"               element={<PdfSplit />} />
          <Route path="/tools/compress-pdf"            element={<PdfCompress />} />
          <Route path="/tools/pdf-to-word"             element={<PdfToWord />} />
          <Route path="/tools/jpg-to-pdf"              element={<JpgToPdf />} />
          <Route path="/tools/pdf-watermark"           element={<PdfWatermark />} />
          <Route path="/tools/pdf-remove-watermark"    element={<PdfRemoveWatermark />} />
          <Route path="/tools/pdf-protect"             element={<PdfProtect />} />
          <Route path="/tools/pdf-unlock"              element={<PdfUnlock />} />
          <Route path="/tools/pdf-page-numbers"        element={<PdfPageNumbers />} />
          <Route path="/tools/qr-code-generator"       element={<QrCodeGenerator />} />
          <Route path="/tools/image-to-text"           element={<ImageToText />} />
          <Route path="/tools/pdf-to-text"             element={<PdfToText />} />
          <Route path="/tools/background-remover"      element={<BackgroundRemover />} />
          <Route path="/tools/resume-ats-checker"      element={<ResumeAtsChecker />} />
          <Route path="/tools/pdf-to-jpg"              element={<PdfToJpg />} />
          <Route path="/tools/word-to-pdf"             element={<WordToPdf />} />
          <Route path="/tools/repair-pdf"              element={<RepairPdf />} />
          <Route path="/tools/remove-pdf-pages"        element={<RemovePdfPages />} />
          <Route path="/tools/word-counter"            element={<WordCounter />} />
          <Route path="/tools/case-converter"          element={<CaseConverter />} />
          <Route path="/tools/json-formatter"          element={<JsonFormatter />} />
          <Route path="/tools/password-generator"      element={<PasswordGenerator />} />
          <Route path="/tools/uuid-generator"          element={<UuidGenerator />} />
          <Route path="*"                              element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
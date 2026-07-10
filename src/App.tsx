import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import { Button } from "@/components/ui/button";
import { useKeyPress } from "@/hooks/useKeyPress";
import { motion, AnimatePresence } from "motion/react";

import { CloudAlert, CloudCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function highlightPattern(text: string, pattern: string) {
  return text.replace(pattern, (value) => `<mark>${value}</mark>`);
}

const sample = "";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    zIndex: 1,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

export default function App() {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [searchText, setSearchText] = useState<string>("");
  const [pageWidth, setPageWidth] = useState<number>(800);
  const [direction, setDirection] = useState(0);
  // const [error, setError] = useState("There was a problem with syncing.");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const updateWidth = () => {
      const width = Math.min(window.innerWidth - 32, 900);
      setPageWidth(width);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  function goToPrevPage(): void {
    if (pageNumber > 1) {
      setDirection(-1);
      setPageNumber((p) => p - 1);
    }
  }

  function goToNextPage(): void {
    if (!numPages || pageNumber < numPages) {
      setDirection(1);
      setPageNumber((p) => p + 1);
    }
  }

  function zoomPos(): void {
    setZoomLevel((z) => Math.min(Number((z + 0.1).toFixed(2)), 3));
  }

  function zoomNeg(): void {
    setZoomLevel((z) => Math.max(Number((z - 0.1).toFixed(2)), 0.2));
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    setSearchText(event.target.value);
  }

  const textRenderer = useCallback(
    (textItem: { str: string }) => highlightPattern(textItem.str, searchText),
    [searchText],
  );

  useKeyPress("ArrowLeft", goToPrevPage, true);
  useKeyPress("ArrowRight", goToNextPage, true);

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    // If the user is zoomed in (zoomLevel > 1), disable click-to-page navigation
    if (zoomLevel > 1) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width / 2) {
      if (pageNumber > 1) goToPrevPage();
    } else {
      if (!numPages || pageNumber < numPages) goToNextPage();
    }
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background relative">
      {/* 1. Added relative and overflow-hidden here to contain sliding pages */}
      <div className="flex-1 overflow-hidden relative bg-muted p-4 flex items-center justify-center">
        <Document
          file={sample}
          onLoadSuccess={onDocumentLoadSuccess}
          className="relative flex items-center justify-center w-full h-full"
        >
          <div
            className="absolute inset-0 z-0 pointer-events-auto cursor-pointer"
            onClick={handleOverlayClick}
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={pageNumber}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  opacity: { duration: 0.1 },
                }}
                // 2. Updated absolute positioning to ensure proper centering inside the canvas area
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-full overflow-auto shadow-xl"
              >
                <Page
                  pageNumber={pageNumber}
                  customTextRenderer={textRenderer}
                  width={pageWidth}
                  scale={zoomLevel}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </Document>
      </div>

      {/* 3. Added relative and solid bg-background to ensure the control panel always sits over the rendering area */}
      <div className="relative z-10 flex items-center justify-center gap-4 border-t bg-background p-4 shadow-sm">
        <div className="hidden lg:flex items-center gap-2">
          <label htmlFor="search" className="text-sm font-medium">
            Search:
          </label>
          <input
            type="search"
            id="search"
            value={searchText}
            onChange={onChange}
            className="border rounded px-2 py-1 text-sm bg-input"
          />
        </div>

        <Button onClick={goToPrevPage} disabled={pageNumber === 1}>
          Previous
        </Button>

        <span className="text-sm font-medium tabular-nums">
          {pageNumber} {numPages && `/ ${numPages}`}
        </span>

        <Button
          onClick={goToNextPage}
          disabled={numPages ? pageNumber === numPages : false}
        >
          Next
        </Button>

        <Button onClick={zoomNeg}>-</Button>
        <span className="text-sm font-medium min-w-[3.5rem] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <Button onClick={zoomPos}>+</Button>
      </div>

      <div className="absolute top-4 right-4">
        {/* <div>{isSaving && <CloudSync />}</div> */}
        <div>
          {error && (
            <Tooltip>
              <TooltipTrigger>
                <CloudAlert
                  onClick={() => {
                    // Only run if the screen width is mobile
                    if (window.innerWidth <= 768) {
                      toast.error(error);
                    }
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>{error}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div>
          {!isSaving && (
            <Tooltip>
              <TooltipTrigger>
                <CloudCheck />
              </TooltipTrigger>
              <TooltipContent>Everything is in sync</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div>
          {isSaving && (
            <Tooltip>
              <TooltipTrigger>
                <RefreshCw className="animate-spin" />
              </TooltipTrigger>
              <TooltipContent>Syncing with your library</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );

  // return (
  //   <div className="flex h-screen flex-col bg-background relative">
  //     <iframe src={sample} className="h-full w-full"></iframe>
  //   </div>
  // );
}

export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

export async function convertPdfToImage(file: File): Promise<PdfConversionResult> {
    // Verifica di esecuzione sul client (Evita errori durante il rendering su server)
    if (typeof window === 'undefined') {
        return {
            imageUrl: '',
            file: null,
            error: 'Operazione disponibile solo lato client',
        };
    }

    let pdfDoc: any = null;
    try {
        // Import dinamico di pdfjs-dist e del worker
        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        const { default: workerSrc } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

        // Legge il file PDF come ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        // Carica il documento PDF
        pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        // Ottiene la prima pagina del PDF
        const page = await pdfDoc.getPage(1);
        // Imposta il viewport con scala 1 (dimensioni originali)
        const viewport = page.getViewport({ scale: 1 });

        // Crea un canvas per il rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Impossibile ottenere il contesto 2D dal canvas');
        }

        // Scala per schermi ad alta densità di pixel (HiDPI)
        const outputScale = window.devicePixelRatio || 1;
        // Imposta dimensione fisica del canvas
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        // Mantiene dimensione CSS invariata per la corretta visualizzazione
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';

        // Matrice di trasformazione per HiDPI (sempre non nulla)
        const transform: [number, number, number, number, number, number] = [
            outputScale, 0, 0, outputScale, 0, 0
        ];

        // Esegue il render della pagina sul canvas
        await page.render({ canvasContext: context, viewport, transform }).promise;

        // Converte il contenuto del canvas in un Blob PNG
        const blob: Blob = await new Promise((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        if (!blob) {
            throw new Error('Errore nella creazione del blob PNG dal canvas');
        }

        // Crea un URL per il blob e un oggetto File PNG
        const imageUrl = URL.createObjectURL(blob);
        const baseName = file.name.replace(/\.[^/.]+$/, ''); // nome senza estensione
        const imageFile = new File([blob], `${baseName}.png`, { type: 'image/png' });

        return {
            imageUrl,
            file: imageFile,
        };
    } catch (error: any) {
        console.error('Errore convertendo PDF in immagine:', error);
        return {
            imageUrl: '',
            file: null,
            error: error?.message || 'Errore sconosciuto durante la conversione del PDF',
        };
    } finally {
        // Distrugge il documento PDF per liberare risorse
        if (pdfDoc) {
            pdfDoc.destroy();
        }
    }
}

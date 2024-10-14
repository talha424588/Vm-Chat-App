
<!DOCTYPE html>
<html>
<head>
    <title>PDF Viewer</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        #pdf-container {
            width: 100%;
            height: 100vh;
            overflow-y: scroll; /* Add a vertical scrollbar */
        }
        .pdf-page {
            width: 100%;
            height: auto;
            page-break-before: always; /* Add a page break before each page */
        }
    </style>
</head>
<body>
    <div id="pdf-container"></div>

    <script>
        const pdfPath = "{{ $pdfPath }}";
        const pdfContainer = document.getElementById("pdf-container");

        // Initialize PDF.js and load the PDF document
        pdfjsLib.getDocument(pdfPath).promise.then(function(pdfDoc) {
            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                pdfDoc.getPage(pageNum).then(function(page) {
                    // Create a container for each page
                    const pageContainer = document.createElement("div");
                    pageContainer.className = "pdf-page";

                    // Append the page container to the pdf-container
                    pdfContainer.appendChild(pageContainer);

                    // Calculate the scale factor based on the viewport dimensions
                    let viewport = page.getViewport({ scale: 1 });
                    let scale = pdfContainer.clientWidth / viewport.width;

                    // Create a canvas to render the page
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");
                    canvas.width = viewport.width * scale;
                    canvas.height = viewport.height * scale;

                    // Append the canvas to the page container
                    pageContainer.appendChild(canvas);

                    // Set the scale on the viewport
                    viewport = page.getViewport({ scale: scale });

                    // Render the page on the canvas with the calculated scale
                    page.render({ canvasContext: context, viewport: viewport });
                });
            }
        });
    </script>
</body>
</html>

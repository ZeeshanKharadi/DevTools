export function printHtmlDocument(documentHtml: string): void {
  const frame = window.document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  window.document.body.appendChild(frame);

  const frameWindow = frame.contentWindow;
  const frameDocument = frame.contentDocument;
  if (!frameWindow || !frameDocument) {
    frame.remove();
    throw new Error("Could not open a print document.");
  }

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) {
      return;
    }
    cleaned = true;
    window.setTimeout(() => frame.remove(), 1000);
  };

  frameWindow.addEventListener("afterprint", cleanup);
  window.setTimeout(cleanup, 60_000);

  frameDocument.open();
  frameDocument.write(documentHtml);
  frameDocument.close();
  frameWindow.focus();
  frameWindow.print();
}

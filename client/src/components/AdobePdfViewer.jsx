import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";

let adobeScriptLoadingPromise = null;

const AdobePdfViewer = forwardRef(
  ({ file, setSelectedText, setIsTextSelected }, ref) => {
    const viewerRef = useRef(null);
    const adobeDCViewInstanceRef = useRef(null);
    const previewFilePromiseRef = useRef(null);

    // Expose gotoPage to parent
    useImperativeHandle(ref, () => ({
      gotoPage: (page) => {
        if (previewFilePromiseRef.current) {
          previewFilePromiseRef.current.then((adobeViewer) => {
            adobeViewer.getAPIs().then((apis) => {
              apis
                .gotoLocation(page, 0, 0)
                .then(() => console.log("Jumped to page", page))
                .catch((err) => console.error("Goto error", err));
            });
          });
        }
      },
    }));

    useEffect(() => {
      if (!file) return;
      let selectionCheckInterval = null;

      function initializeViewer() {
        if (!window.AdobeDC) return;

        adobeDCViewInstanceRef.current = new window.AdobeDC.View({
          clientId: "38c90a9c49bd4c5b8e96702b40b5ca75",
          divId: "adobe-dc-view",
          downloadWithCredentials: false,
        });

        previewFilePromiseRef.current =
          adobeDCViewInstanceRef.current.previewFile(
            {
              content: { location: { url: file.url } },
              metaData: { fileName: file.file.name },
            },
            {
              embedMode: "FULL_WINDOW",
              showDownloadPDF: true,
              showZoomControl: true,
              showBookmarks: false,
              showAnnotationTools: true,
            }
          );

        adobeDCViewInstanceRef.current.registerCallback(
          window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
          (event) => {
            if (
              event.type === "PREVIEW_SELECTION_END" ||
              event.type === "PREVIEW_CLICK"
            ) {
              previewFilePromiseRef.current.then((adobeViewer) => {
                adobeViewer.getAPIs().then((apis) => {
                  apis
                    .getSelectedContent()
                    .then((selection) => {
                      const text =
                        selection?.type === "text" ? selection.data : "";
                      setSelectedText(text);
                      setIsTextSelected(!!text);

                      clearInterval(selectionCheckInterval);
                      if (text) {
                        selectionCheckInterval = setInterval(() => {
                          apis
                            .getSelectedContent()
                            .then((checkSel) => {
                              const currentText =
                                checkSel?.type === "text"
                                  ? checkSel.data
                                  : "";
                              if (!currentText) {
                                setIsTextSelected(false);
                                clearInterval(selectionCheckInterval);
                              }
                            })
                            .catch(() => {});
                        }, 100);
                      }
                    })
                    .catch(() => setIsTextSelected(false));
                });
              });
            }
          },
          { enableFilePreviewEvents: true }
        );
      }

      if (!window.AdobeDC) {
        if (!adobeScriptLoadingPromise) {
          adobeScriptLoadingPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src =
              "https://acrobatservices.adobe.com/view-sdk/viewer.js";
            script.onload = () => {
              document.addEventListener("adobe_dc_view_sdk.ready", resolve);
            };
            script.onerror = () => reject("Failed to load Adobe SDK script");
            document.body.appendChild(script);
          });
        }
        adobeScriptLoadingPromise
          .then(() => initializeViewer())
          .catch((err) => console.error(err));
      } else {
        if (window.AdobeDC && window.AdobeDC.View) {
          initializeViewer();
        } else {
          document.addEventListener(
            "adobe_dc_view_sdk.ready",
            initializeViewer
          );
        }
      }

      return () => {
        if (adobeDCViewInstanceRef.current) {
          const container = document.getElementById("adobe-dc-view");
          if (container) container.innerHTML = "";
          adobeDCViewInstanceRef.current = null;
        }
        clearInterval(selectionCheckInterval);
      };
    }, [file]);

    return (
      <div
        id="adobe-dc-view"
        ref={viewerRef}
        style={{
          height: "100%",
          width: "100%",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      ></div>
    );
  }
);

export default AdobePdfViewer;

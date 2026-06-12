Created At: 2026-06-03T06:15:28Z
Completed At: 2026-06-03T06:15:28Z
File Path: `file:///Users/sarhamsan/Documents/SARHAM/Pengeluaran/src/components/ExpenseEntry.svelte`
Total Lines: 1373
Total Bytes: 40192
Showing lines 146 to 945
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
146:     const file = e.target.files[0];
147:     if (!file) return;
148:     selectedFileName = file.name;
149:     runOcr(file);
150:   }
151: 
152:   async function runOcr(file) {
153:     if (typeof window === 'undefined') return;
154:     
155:     isScanning = true;
156:     ocrStatusText = 'Menghubungkan ke Engine OCR...';
157:     scanProgress = 5;
158: 
159:     // Unduh Tesseract.js via CDN jika belum termuat
160:     if (!window.Tesseract) {
161:       try {
162:         await loadTesseractScript();
163:       } catch (err) {
164:         ui.addNotification("Gagal memuat engine OCR Tesseract: " + err.message, "error");
165:         isScanning = false;
166:         return;
167:       }
168:     }
169:     
170:     ocrStatusText = 'Menginisialisasi pemindaian...';
171:     scanProgress = 15;
172:     
173:     try {
174:       const imageUrl = URL.createObjectURL(file);
175:       
176:       const { data: { text } } = await window.Tesseract.recognize(
177:         imageUrl,
178:         'ind',
179:         {
180:           logger: m => {
181:             if (m.status === 'recognizing text') {
182:               ocrStatusText = `Mengekstrak teks struk... ${Math.round(m.progress * 100)}%`;
183:               scanProgress = 15 + Math.round(m.progress * 85);
184:             } else {
185:               ocrStatusText = `${m.status === 'loading tesseract api' ? 'Memuat Engine OCR' : m.status}...`;
186:               scanProgress = Math.min(scanProgress + 1, 15);
187:             }
188:           }
189:         }
190:       );
191:       
192:  
<truncated 28151 bytes>
:     font-weight: 700;
870:     font-size: 0.8125rem;
871:     cursor: pointer;
872:   }
873: 
874:   .fields-grid {
875:     display: grid;
876:     grid-template-cols: 1fr;
877:     gap: 0.75rem;
878:   }
879: 
880:   @media (min-width: 768px) {
881:     .fields-grid {
882:       grid-template-cols: 3fr 2fr 2fr 1fr;
883:       align-items: center;
884:       width: 100%;
885:       padding-right: 2.25rem;
886:       position: relative;
887:     }
888:   }
889: 
890:   .field-item {
891:     display: flex;
892:     flex-direction: column;
893:     gap: 0.25rem;
894:   }
895: 
896:   .mobile-only-lbl {
897:     font-size: 0.75rem;
898:     font-weight: 600;
899:     color: var(--text-secondary);
900:   }
901: 
902:   @media (min-width: 768px) {
903:     .mobile-only-lbl {
904:       display: none;
905:     }
906:   }
907: 
908:   .input-prefix-wrapper {
909:     position: relative;
910:   }
911: 
912:   .input-prefix {
913:     position: absolute;
914:     left: 0.875rem;
915:     top: 50%;
916:     transform: translateY(-50%);
917:     font-size: 0.875rem;
918:     font-weight: 600;
919:     color: var(--text-muted);
920:     pointer-events: none;
921:   }
922: 
923:   .input-prefix-wrapper input {
924:     padding-left: 2.25rem;
925:   }
926: 
927:   .btn-delete-row-icon {
928:     display: flex;
929:     align-items: center;
930:     justify-content: center;
931:     background-color: rgba(255, 255, 255, 0.05);
932:     border: 1px solid var(--border-color);
933:     color: var(--text-secondary);
934:     width: 32px;
935:     height: 32px;
936:     border-radius: 8px;
937:     cursor: pointer;
938:     transition: all 0.15s ease;
939:   }
940: 
941:   .btn-delete-row-icon:hover {
942:     background-color: var(--color-danger-bg);
943:     border-color: var(--color-danger-border);
944:     color: var(--color-danger);
945:   }
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.

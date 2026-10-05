import { oneLiner, bodyCopy, stripMarkdown } from "./src/lib/product-copy";

const cases = [
  "### Precision MS Round Duct Manufacturing\n\nOur ducts are fabricated using controlled sheet-metal processes to achieve accurate circular dimensions and proper connections.",
  "### Precision SS Rectangular Duct Manufacturing\n\nOur stainless steel ducts are accurately cut, formed and assembled according to approved drawings.",
  "### Precision Sheet Metal Cutting\n\nThe cutting process can be carried out according to CAD drawings and required component dimensions.",
  "We can manufacture ducts as per approved shop drawings and project specifications, including customized dimensions, thickness, reinforcement and configuration.",
  "MS rectangular ducts",
  "**CISBOND-FR 802 Fire Coating** is a fire-protection coating solution used for ductwork.",
];

for (const c of cases) {
  const l = oneLiner(c);
  console.log(`ONELINER (${String(l.length).padStart(3)}) ${l}`);
  console.log(`BODY     (${String(bodyCopy(c).length).padStart(3)}) ${bodyCopy(c).replace(/\n/g, "\\n")}`);
  console.log(`STRIP    (${String(stripMarkdown(c).length).padStart(3)}) ${stripMarkdown(c).replace(/\n/g, "\\n")}`);
  console.log("");
}

var express = require('express');
const multer = require('multer');
var path = require('path');
var router = express.Router();

//for pdf
const PDFLoader = require("langchain/document_loaders/fs/pdf").PDFLoader;
const Chroma = require("langchain/vectorstores/chroma").Chroma;
const OpenAIEmbeddings = require("langchain/embeddings/openai").OpenAIEmbeddings;
const { ConversationalRetrievalQAChain } = require("langchain/chains");
const { BufferMemory }=require("langchain/memory");
const { ChatOpenAI }=require("langchain/chat_models/openai");
const { stringify } = require('querystring');
require("dotenv").config();

async function loadPdf(pdfPath) {
  const loader = new PDFLoader(pdfPath);
  const docs = await loader.loadAndSplit();
  console.log(docs.length);
  return docs;
}

router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, 'public', '*index.html'));
});

// Create a storage engine for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, file.originalname);
  },
});
// Create the multer upload instance
const upload = multer({ storage: storage });
let collection=null;
router.post('/fileupload', upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(404).json({ msg: "file is not found" });
  }
  const documents = await loadPdf(req.file.path);
  const embedder = new OpenAIEmbeddings({ openai_api_key: process.env.OPENAI_API_KEY });
  try {
    collection = await Chroma.fromDocuments(documents, embedder, {
      collectionName: stringify(req.file.filename),
    });
    console.log("Collection created:\n", collection.name);
    res.json({ filename: req.file.filename });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// let messages=[];
// router.post('/query',upload.none(),async(req, res, next)=>{
//   console.log(req.body.query)
//   console.log("hello",collection);
//   const memory = new BufferMemory({
//     memoryKey: "chat_history",
//     returnMessages: true,
//   });
//   const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo"});//, openai_api_key: process.env.OPENAI_API_KEY 
//   const chain= ConversationalRetrievalQAChain.fromLLM(model, collection.asRetriever(), {
//     memory
//   });  
//   try {
//     const result = await chain.call({ question: req.body.query });
//     messages.push(result);
//     res.json({ msgs: messages});
//   } catch (error) {
//     console.error(error);
//     res.status(500). send('Internal Server Error');
//   }
// })



let messages=[];
router.post('/query', upload.none(), async (req, res, next) => {
  console.log("hello", collection);
  const memory = new BufferMemory({
    memoryKey: "chat_history",
    returnMessages: true,
  });
  const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo" }); //, openai_api_key: process.env.OPENAI_API_KEY 
  const chain = ConversationalRetrievalQAChain.fromLLM(model, collection.asRetriever(), {
    memory
  });
  try {
    const result = await chain.call({ question: req.body.query });
    messages.push(result);
    res.json({ msgs: messages, length: messages.length });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
});
module.exports = router;

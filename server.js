const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limite
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido!'));
    }
  }
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para processar o formulário
app.post('/enviar-formulario', upload.array('documentos', 10), async (req, res) => {
  try {
    const dados = req.body;
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 NOVA SOLICITAÇÃO DE CONTRATO RECEBIDA');
    console.log('='.repeat(60));
    
    console.log('\n🏢 DADOS DA EMPRESA:');
    console.log(`Razão Social: ${dados.razaoSocial}`);
    console.log(`Nome Fantasia: ${dados.nomeFantasia || 'Não informado'}`);
    console.log(`CNPJ: ${dados.cnpj}`);
    console.log(`Inscrição Estadual: ${dados.inscricaoEstadual || 'Não informado'}`);
    console.log(`Ramo: ${dados.ramo}`);
    console.log(`Porte: ${dados.porte}`);
    
    console.log('\n📍 ENDEREÇO:');
    console.log(`${dados.endereco}, ${dados.numero}`);
    console.log(`${dados.complemento ? dados.complemento + ', ' : ''}${dados.bairro}`);
    console.log(`${dados.cidade} - ${dados.estado}`);
    console.log(`CEP: ${dados.cep}`);
    
    console.log('\n👤 REPRESENTANTE LEGAL:');
    console.log(`Nome: ${dados.nomeRepresentante}`);
    console.log(`Cargo: ${dados.cargo}`);
    console.log(`CPF: ${dados.cpf}`);
    console.log(`RG: ${dados.rg}`);
    console.log(`Email: ${dados.email}`);
    console.log(`Telefone: ${dados.telefone}`);
    
    console.log('\n📄 INFORMAÇÕES DO CONTRATO:');
    console.log(`Tipo: ${dados.tipoContrato}`);
    console.log(`Data de Início: ${dados.dataInicio || 'Não especificada'}`);
    console.log(`Descrição dos Serviços:`);
    console.log(`${dados.descricaoServicos}`);
    if (dados.observacoes) {
      console.log(`Observações: ${dados.observacoes}`);
    }
    
    if (req.files && req.files.length > 0) {
      console.log('\n📎 DOCUMENTOS ANEXADOS:');
      req.files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);
        console.log(`   Salvo como: ${file.filename}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`⏰ Recebido em: ${new Date().toLocaleString('pt-BR')}`);
    console.log('='.repeat(60) + '\n');
    
    res.json({ 
      success: true, 
      message: 'Solicitação de contrato recebida com sucesso!' 
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar solicitação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Servidor SaaS Mercado iniciado!');
  console.log(`📱 Acesse: http://localhost:${PORT}`);
  console.log(`📁 Documentos salvos em: ./uploads/`);
  console.log(`📋 Aguardando solicitações de contrato...\n`);
});
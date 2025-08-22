// Aguardar carregamento da página
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contractForm');
    const fileInput = document.getElementById('documentos');
    const fileList = document.getElementById('fileList');
    const message = document.getElementById('message');
    const submitBtn = form.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    let selectedFiles = [];
    
    // Aplicar máscaras nos campos
    applyMasks();
    
    // Configurar busca de CEP
    setupCepSearch();
    
    // Configurar upload de arquivos
    setupFileUpload();
    
    // Configurar envio do formulário
    setupFormSubmission();
    
    // Função para aplicar máscaras
    function applyMasks() {
        // Máscara para CNPJ
        const cnpjInput = document.getElementById('cnpj');
        cnpjInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            // Limitar a 14 dígitos
            value = value.substring(0, 14);
            value = value.replace(/(\d{2})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1/$2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
            e.target.value = value;
        });
        
        // Máscara para CPF
        const cpfInput = document.getElementById('cpf');
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            // Limitar a 11 dígitos
            value = value.substring(0, 11);
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})/, '$1-$2');
            e.target.value = value;
        });
        
        // Máscara para Telefone
        const telefoneInput = document.getElementById('telefone');
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            // Limitar a 11 dígitos (celular) ou 10 dígitos (fixo)
            value = value.substring(0, 11);
            if (value.length <= 10) {
                // Telefone fixo: (00) 0000-0000
                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                value = value.replace(/(\d{4})(\d)/, '$1-$2');
            } else {
                // Celular: (00) 00000-0000
                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                value = value.replace(/(\d{5})(\d)/, '$1-$2');
            }
            e.target.value = value;
        });
        
        // Máscara para CEP
        const cepInput = document.getElementById('cep');
        cepInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            // Limitar a 8 dígitos
            value = value.substring(0, 8);
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
        });
    }
    
    // Função para busca de CEP
    function setupCepSearch() {
        const cepInput = document.getElementById('cep');
        
        cepInput.addEventListener('blur', function() {
            const cep = this.value.replace(/\D/g, '');
            
            if (cep.length === 8) {
                fetch(`https://viacep.com.br/ws/${cep}/json/`)
                    .then(response => response.json())
                    .then(data => {
                        if (!data.erro) {
                            document.getElementById('endereco').value = data.logradouro;
                            document.getElementById('bairro').value = data.bairro;
                            document.getElementById('cidade').value = data.localidade;
                            document.getElementById('estado').value = data.uf;
                        }
                    })
                    .catch(error => {
                        console.log('Erro ao buscar CEP:', error);
                    });
            }
        });
    }
    
    // Função para configurar upload de arquivos
    function setupFileUpload() {
        fileInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            selectedFiles = [...selectedFiles, ...files];
            updateFileList();
        });
    }
    
    // Atualizar lista de arquivos
    function updateFileList() {
        fileList.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span><i class="fas fa-file"></i> ${file.name} (${formatFileSize(file.size)})</span>
                <button type="button" onclick="removeFile(${index})">
                    <i class="fas fa-trash"></i> Remover
                </button>
            `;
            fileList.appendChild(fileItem);
        });
    }
    
    // Remover arquivo
    window.removeFile = function(index) {
        selectedFiles.splice(index, 1);
        updateFileList();
    }
    
    // Formatar tamanho do arquivo
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Configurar envio do formulário
    function setupFormSubmission() {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validações
            if (!validateForm()) {
                return;
            }
            
            // Preparar dados
            const formData = new FormData();
            
            // Adicionar todos os campos do formulário
            const formElements = form.elements;
            for (let element of formElements) {
                if (element.name && element.type !== 'file' && element.type !== 'submit') {
                    if (element.type === 'checkbox') {
                        formData.append(element.name, element.checked);
                    } else {
                        formData.append(element.name, element.value);
                    }
                }
            }
            
            // Adicionar arquivos
            selectedFiles.forEach(file => {
                formData.append('documentos', file);
            });
            
            // Mostrar loading
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
            
            try {
                const response = await fetch('/enviar-formulario', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('Solicitação enviada com sucesso! Entraremos em contato em breve.', 'success');
                    form.reset();
                    selectedFiles = [];
                    updateFileList();
                } else {
                    showMessage(result.message || 'Erro ao enviar solicitação. Tente novamente.', 'error');
                }
            } catch (error) {
                console.error('Erro:', error);
                showMessage('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
            } finally {
                // Esconder loading
                submitBtn.disabled = false;
                btnText.style.display = 'flex';
                btnLoading.style.display = 'none';
            }
        });
    }
    
    // Validar formulário
    function validateForm() {
        const requiredFields = [
            'razaoSocial', 'cnpj', 'ramo', 'porte', 'cep', 'endereco', 
            'numero', 'bairro', 'cidade', 'estado', 'nomeRepresentante', 
            'cargo', 'cpf', 'rg', 'email', 'telefone', 'tipoContrato', 
            'descricaoServicos'
        ];
        
        for (let fieldName of requiredFields) {
            const field = document.getElementById(fieldName);
            if (!field.value.trim()) {
                showMessage(`O campo "${field.previousElementSibling.textContent.replace(' *', '')}" é obrigatório!`, 'error');
                field.focus();
                return false;
            }
        }
        
        // Validar checkbox de termos
        const termos = document.getElementById('termos');
        if (!termos.checked) {
            showMessage('Você deve aceitar os termos para continuar!', 'error');
            return false;
        }
        
        // Validar se há arquivos
        if (selectedFiles.length === 0) {
            showMessage('É obrigatório anexar pelo menos um documento!', 'error');
            return false;
        }
        
        // Validar CNPJ
        const cnpj = document.getElementById('cnpj').value.replace(/\D/g, '');
        if (cnpj.length !== 14) {
            showMessage('CNPJ deve ter 14 dígitos!', 'error');
            return false;
        }
        
        // Validar CPF
        const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
        if (cpf.length !== 11) {
            showMessage('CPF deve ter 11 dígitos!', 'error');
            return false;
        }
        
        return true;
    }
    
    // Mostrar mensagem
    function showMessage(text, type) {
        message.textContent = text;
        message.className = `message ${type}`;
        message.style.display = 'block';
        
        // Scroll para a mensagem
        message.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(() => {
            message.style.display = 'none';
        }, 5000);
    }
});
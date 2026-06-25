const bancoProdutos = {
    "1001": "Arroz Integral 1kg",
    "1002": "Feijão Preto 1kg",
    "1003": "Leite UHT Integral 1L",
    "1004": "Detergente Neutro 500ml",
    "1005": "Iogurte de Morango 500g"
};

const OPERADOR_PADRAO = { matricula: "op", nome: "Operador Geral", perfil: "operador", senha: "123" };
let usuarioLogado = null;

window.onload = function() {
    if (!localStorage.getItem("usuarios")) {
        localStorage.setItem("usuarios", JSON.stringify([OPERADOR_PADRAO]));
    }
    if (!localStorage.getItem("produtos_cadastrados")) {
        localStorage.setItem("produtos_cadastrados", JSON.stringify([]));
    }
    if (!localStorage.getItem("historico_baixas")) {
        localStorage.setItem("historico_baixas", JSON.stringify([]));
    }
    atualizarSubsetores();
};

// Gerenciador de Modais Customizados (Substitui alerts)
function dispararModal(titulo, msg) {
    document.getElementById("modal-title").innerText = titulo;
    document.getElementById("modal-message").innerText = msg;
    document.getElementById("custom-modal").classList.remove("hidden");
}
function fecharModal() {
    document.getElementById("custom-modal").classList.add("hidden");
}

// Fluxo de Modais para Troca de Senha (Substitui o prompt)
function abrirModalSenha() {
    document.getElementById("modal-new-password").value = "";
    document.getElementById("password-modal").classList.remove("hidden");
}
function fecharModalSenha() {
    document.getElementById("password-modal").classList.add("hidden");
}
function processarAlterarSenha() {
    const nova = document.getElementById("modal-new-password").value.trim();
    if (!nova) return dispararModal("Aviso", "Preencha uma nova senha válida!");
    
    let lista = JSON.parse(localStorage.getItem("usuarios"));
    let idx = lista.findIndex(u => u.matricula === usuarioLogado.matricula);
    lista[idx].senha = nova;
    localStorage.setItem("usuarios", JSON.stringify(lista));
    
    fecharModalSenha();
    dispararModal("Sucesso", "Senha updated com sucesso!");
}

function renderizarListaSecoes() {
    const container = document.getElementById("lista-secoes-interativas");
    container.innerHTML = "";

    let produtos = JSON.parse(localStorage.getItem("produtos_cadastrados")) || [];
    
    const todasSecoes = [
        "01 ACOUGUE", "02 CONGELADOS", "03 SUPERGELADOS", "04 SALGADOS", 
        "05 LATICINIOS I", "06 LATICINIOS II", "07 PEIXARIA", "08 PADARIA", 
        "09 HORTIFRUTI", "10 CEREAIS", "11 MASSAS", "12 CONSERVAS", 
        "13 MATINAIS", "14 BISCOITOS", "15 SOBREMESAS", "16 BOMBONIERE", 
        "17 BEBIDAS I", "18 BEBIDAS II", "19 HIGIENE", "20 LIMPEZA", 
        "21 BAZAR", "22 +SAUDAVEIS"
    ];

    todasSecoes.forEach(secao => {
        let produtosDaSecao = produtos.filter(p => p.subsetor === secao);
        
        let possuiAlerta = produtosDaSecao.some(p => {
            if (p.status === "esgotado") return false;
            let hoje = new Date();
            let dataVenc = new Date(p.validade + "T00:00:00");
            let diffDays = Math.ceil((dataVenc - hoje) / (1000 * 60 * 60 * 24));
            return diffDays <= 7;
        });

        let todosEsgotados = produtosDaSecao.length > 0 && produtosDaSecao.every(p => p.status === "esgotado");

        let btn = document.createElement("div");
        btn.className = `btn-secao-link ${possuiAlerta ? 'alerta-vencimento' : ''} ${todosEsgotados ? 'status-esgotado' : ''}`;
        
        btn.innerHTML = `
            <span>${secao}</span>
            <span class="badge-qtd">${produtosDaSecao.filter(p => p.status !== 'esgotado').length} Ativo(s)</span>
        `;
        
        btn.onclick = function() {
            abrirSecaoProdutos(secao);
        };
        
        container.appendChild(btn);
    });
}

function navegarPara(tela) {
    document.getElementById("menu-screen").classList.add("hidden");
    document.getElementById("screen-cadastro").classList.add("hidden");
    document.getElementById("screen-consulta").classList.add("hidden");
    document.getElementById("screen-produtos-subsetor").classList.add("hidden");

    if (tela === 'menu') document.getElementById("menu-screen").classList.remove("hidden");
    if (tela === 'cadastro') {
        document.getElementById("screen-cadastro").classList.remove("hidden");
        renderizarTabelaCadastro();
    }
    if (tela === 'consulta') {
        document.getElementById("screen-consulta").classList.remove("hidden");
        renderizarListaSecoes();
    }
}

function alternarAuth(mostrarCadastro) {
    document.getElementById("login-box").classList.toggle("hidden", mostrarCadastro);
    document.getElementById("register-box").classList.toggle("hidden", !mostrarCadastro);
}

function cadastrarUsuario() {
    const matricula = document.getElementById("reg-matricula").value.trim();
    const nome = document.getElementById("reg-nome").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const senha = document.getElementById("reg-senha").value;

    if (!matricula || !nome || !email || !senha) return dispararModal("Aviso", "Preencha todos os campos!");

    let lista = JSON.parse(localStorage.getItem("usuarios"));
    if (lista.find(u => u.matricula === matricula)) return dispararModal("Erro", "Matrícula já cadastrada!");

    lista.push({ matricula, nome, email, senha, perfil: "gestor" });
    localStorage.setItem("usuarios", JSON.stringify(lista));
    dispararModal("Sucesso", "Gestor cadastrado com sucesso!");
    alternarAuth(false);
}

function fazerLogin() {
    const mat = document.getElementById("login-matricula").value.trim();
    const sen = document.getElementById("login-senha").value;

    let lista = JSON.parse(localStorage.getItem("usuarios")) || [];
    let user = lista.find(u => u.matricula === mat && u.senha === sen);

    if (user) {
        usuarioLogado = user;
        document.getElementById("auth-screen").classList.add("hidden");
        document.getElementById("app-screen").classList.remove("hidden");
        
        document.getElementById("txt-nome-usuario").innerHTML = `<strong>${user.nome}</strong>`;
        document.getElementById("txt-perfil-usuario").innerText = user.perfil.toUpperCase();

        if (user.perfil === "operador") {
            document.getElementById("area-cadastro").classList.add("hidden");
        } else {
            document.getElementById("area-cadastro").classList.remove("hidden");
        }

        navegarPara('menu');
        verificarAlertasGlobais();
    } else {
        dispararModal("Erro de Acesso", "A matrícula ou a senha inserida está incorreta ou não existe no sistema.");
    }
}

function deslogar() {
    usuarioLogado = null;
    document.getElementById("app-screen").classList.add("hidden");
    document.getElementById("auth-screen").classList.remove("hidden");
}

function buscarProdutoPorCodigo() {
    const cod = document.getElementById("prod-codigo").value.trim();
    const descInput = document.getElementById("prod-descricao");
    
    if (bancoProdutos[cod]) {
        descInput.value = bancoProdutos[cod];
        descInput.readOnly = true;
    } else {
        descInput.value = "";
        descInput.readOnly = false;
        descInput.placeholder = "Código novo! Digite a descrição manualmente";
    }
}

function salvarProduto(event) {
    event.preventDefault();

    const idEdicao = document.getElementById("prod-id-edicao") ? document.getElementById("prod-id-edicao").value : "";
    const codigo = document.getElementById("prod-codigo").value;
    const descricao = document.getElementById("prod-descricao").value;
    const setor = document.getElementById("prod-setor").value;
    const subsetor = document.getElementById("prod-subsetor").value;
    const validade = document.getElementById("prod-validade").value;
    const lote = document.getElementById("prod-lote").value;
    const qtd = document.getElementById("prod-qtd").value;

    let Court = JSON.parse(localStorage.getItem("produtos_cadastrados")) || [];
    let produtoExistenteIndex = Court.findIndex(p => p.codigo === codigo);

    if (produtoExistenteIndex !== -1 && !idEdicao) {
        let produtoVelho = Court[produtoExistenteIndex];
        
        if (produtoVelho.status !== "esgotado") {
            let historico = JSON.parse(localStorage.getItem("historico_baixas")) || [];
            historico.push({
                idLog: Date.now(),
                codigo: produtoVelho.codigo,
                descricao: produtoVelho.descricao,
                setor: produtoVelho.setor,
                subsetor: produtoVelho.subsetor,
                lote: produtoVelho.lote,
                qtdBaixada: produtoVelho.qtd,
                validadeOriginal: produtoVelho.validade,
                baixadoPor: "Sistema (Reposição de Estoque)",
                dataBaixa: new Date().toLocaleDateString('pt-BR') + " (Atualização)"
            });
            localStorage.setItem("historico_baixas", JSON.stringify(historico));
        }

        Court[produtoExistenteIndex] = {
            id: produtoVelho.id,
            codigo, descricao, setor, subsetor, validade, lote, qtd, status: "ativo"
        };
        dispararModal("Sucesso", "Novo lote registrado. Lote anterior salvo no histórico!");
    } else if (idEdicao) {
        let idx = Court.findIndex(p => p.id == idEdicao);
        if (idx !== -1) {
            Court[idx] = { ...Court[idx], codigo, descricao, setor, subsetor, validade, lote, qtd, status: "ativo" };
        }
        dispararModal("Sucesso", "Dados do produto editados com sucesso!");
    } else {
        Court.push({
            id: Date.now(),
            codigo, descricao, setor, subsetor, validade, lote, qtd, status: "ativo"
        });
        dispararModal("Sucesso", "Produto integrado e salvo na subseção com sucesso!");
    }

    localStorage.setItem("produtos_cadastrados", JSON.stringify(Court));
    document.getElementById("form-produto").reset();
    if (document.getElementById("prod-id-edicao")) document.getElementById("prod-id-edicao").value = "";
    if (document.getElementById("titulo-formulario-cadastro")) document.getElementById("titulo-formulario-cadastro").innerText = "Registar / Atualizar Entrada de Lote";
    if (document.getElementById("btn-cancelar-edicao")) document.getElementById("btn-cancelar-edicao").classList.add("hidden");
    
    atualizarSubsetores();
    renderizarTabelaCadastro();
    verificarAlertasGlobais();
}

function darBaixa(id) {
    darBaixaInterna(id);
}

function renderizarTabelaCadastro() {
    const tbody = document.getElementById("tabela-todos-produtos");
    tbody.innerHTML = "";
    let produtos = JSON.parse(localStorage.getItem("produtos_cadastrados")) || [];
    
    const inputBusca = document.getElementById("busca-codigo-tabela");
    const termoBusca = inputBusca ? inputBusca.value.trim().toLowerCase() : "";

    // Filtro otimizado: Compara o termo com o código interno ou com a descrição textual
    if (termoBusca) {
        produtos = produtos.filter(p => 
            p.codigo.toLowerCase().includes(termoBusca) || 
            p.descricao.toLowerCase().includes(termoBusca)
        );
    }

    if(produtos.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Nenhum produto encontrado.</td></tr>";
        return;
    }

    produtos.forEach(p => {
        let tr = document.createElement("tr");
        let infoValidade = "";
        
        if (p.status === "esgotado") {
            tr.className = "status-esgotado";
            infoValidade = "<span class='text-esgotado'>BAIXADO (Esgotado)</span>";
        } else {
            infoValidade = new Date(p.validade + "T00:00:00").toLocaleDateString('pt-BR') + ` (Lote: ${p.lote})`;
        }

        tr.innerHTML = `
            <td><strong>${p.codigo}</strong></td>
            <td>${p.descricao}</td>
            <td>${infoValidade}</td>
            <td>
                <button class="btn-acao-tabela btn-acao-edit" onclick="prepararEdicao(${p.id})">✏️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarTabelaCadastro() {
    renderizarTabelaCadastro();
}

function prepararEdicao(id) {
    let produtos = JSON.parse(localStorage.getItem("produtos_cadastrados")) || [];
    let p = produtos.find(item => item.id === id);
    
    if (p) {
        if (document.getElementById("prod-id-edicao")) document.getElementById("prod-id-edicao").value = p.id;
        document.getElementById("prod-codigo").value = p.codigo;
        document.getElementById("prod-descricao").value = p.descricao;
        document.getElementById("prod-setor").value = p.setor;
        atualizarSubsetores();
        document.getElementById("prod-subsetor").value = p.subsetor;
        document.getElementById("prod-validade").value = p.status === "esgotado" ? "" : p.validade;
        document.getElementById("prod-lote").value = p.status === "esgotado" ? "" : p.lote;
        document.getElementById("prod-qtd").value = p.status === "esgotado" ? "" : p.qtd;
        
        if (document.getElementById("titulo-formulario-cadastro")) {
            document.getElementById("titulo-formulario-cadastro").innerText = "Atualizar / Dar Entrada em: " + p.codigo;
        }
        if (document.getElementById("btn-cancelar-edicao")) {
            document.getElementById("btn-cancelar-edicao").classList.remove("hidden");
        }
        const areaCad = document.getElementById("area-cadastro");
        if (areaCad) areaCad.scrollIntoView({ behavior: 'smooth' });
    }
}

function cancelarEdicao() {
    document.getElementById("form-produto").reset();
    if (document.getElementById("prod-id-edicao")) document.getElementById("prod-id-edicao").value = "";
    document.getElementById("prod-descricao").readOnly = true;
    if (document.getElementById("titulo-formulario-cadastro")) document.getElementById("titulo-formulario-cadastro").innerText = "Registar / Atualizar Entrada de Lote";
    if (document.getElementById("btn-cancelar-edicao")) document.getElementById("btn-cancelar-edicao").classList.add("hidden");
}

function renderizarEstoque() {
    const container = document.getElementById("container-estoque-dinamico");
    if (!container) return;
    const filtroSetor = document.getElementById("filtro-setor").value;
    const filtroSubsetor = document.getElementById("filtro-subsetor").value;
    container.innerHTML = "";

    let produtos = JSON.parse(localStorage.getItem("produtos_cadastrados")) || [];
    let estrutura = {};

    produtos.forEach(p => {
        if (filtroSetor !== "Todos" && p.setor !== filtroSetor) return;
        if (filtroSubsetor !== "Todos" && p.subsetor !== filtroSubsetor) return;
        
        if (!estrutura[p.setor]) estrutura[p.setor] = {};
        if (!estrutura[p.setor][p.subsetor]) estrutura[p.setor][p.subsetor] = [];
        estrutura[p.setor][p.subsetor].push(p);
    });

    if (Object.keys(estrutura).length === 0) {
        container.innerHTML = "<p style='padding:20px 10px; font-size:14px; text-align:center; color:#7f8c8d;'>Nenhum lote encontrado para este filtro.</p>";
        return;
    }

    for (let setor in estrutura) {
        let sCard = document.createElement("div");
        sCard.className = "setor-card";
        sCard.innerHTML = `<div class="setor-header">📦 Setor: ${setor}</div>`;

        for (let sub in estrutura[setor]) {
            let subHeader = document.createElement("div");
            subHeader.className = "sub-header";
            subHeader.innerText = `↳ Seção: ${sub}`;
            sCard.appendChild(subHeader);

            estrutura[setor][sub].forEach(p => {
                let pRow = document.createElement("div");
                
                if (p.status === "esgotado") {
                    pRow.className = "prod-row-mobile esgotado";
                    pRow.innerHTML = `
                        <div>
                            <strong>${p.descricao}</strong>
                            <div class="prod-info-meta">Cód: ${p.codigo} | <span class="text-esgotado">PRODUTO BAIXADO (Sem estoque)</span></div>
                        </div>
                        <button class="btn-primary btn-orange" style="width:auto; padding:8px 14px; font-size:13px;" onclick="navegarParaCadastroComCodigo('${p.codigo}')">Recadastrar</button>
                    `;
                } else {
                    let hoje = new Date();
                    let dataVenc = new Date(p.validade + "T00:00:00");
                    let diffDays = Math.ceil((dataVenc - hoje) / (1000 * 60 * 60 * 24));
                    let visualUrgente = diffDays <= 7 ? "urgente" : "";

                    pRow.className = `prod-row-mobile ${visualUrgente}`;
                    pRow.innerHTML = `
                        <div>
                            <strong>${p.descricao}</strong>
                            <div class="prod-info-meta">Cód: ${p.codigo} | Lote: ${p.lote} | Qtd: ${p.qtd}</div>
                            <div class="prod-info-meta" style="color: ${diffDays <= 7 ? 'var(--danger)' : 'inherit'}; font-weight: ${diffDays <= 7 ? 'bold' : 'normal'}">
                                Vence em: ${dataVenc.toLocaleDateString('pt-BR')} (${diffDays} dias)
                            </div>
                        </div>
                        ${usuarioLogado.perfil !== 'operador' ? `<button class="btn-primary btn-danger" style="width:auto; padding:8px 14px; font-size:13px;" onclick="darBaixaInterna(${p.id})">Baixar</button>` : ''}
                    `;
                }
                sCard.appendChild(pRow);
            });
        }
        container.appendChild(sCard);
    }
}

function navegarParaCadastroComCodigo(codigo) {
    navegarPara('cadastro');
    document.getElementById("prod-codigo").value = codigo;
    buscarProdutoPorCodigo();
}

function verificarAlertasGlobais() {
    const alertaBox = document.getElementById("alert-section");
    if (!alertaBox) return;
    const listaAlertas = document.getElementById("lista-alertas");
    listaAlertas.innerHTML = "";

    let produtos = JSON.parse(localStorage.getItem("produtos_cadastrados")) || [];
    let contadorAlertas = 0;

    produtos.forEach(p => {
        if (p.status === "esgotado") return;
        let hoje = new Date();
        let dataVenc = new Date(p.validade + "T00:00:00");
        let diffDays = Math.ceil((dataVenc - hoje) / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) {
            contadorAlertas++;
            let li = document.createElement("li");
            li.innerHTML = `• <strong>${p.descricao}</strong> (Lote ${p.lote}) vence em ${diffDays} dias no setor ${p.setor}.`;
            listaAlertas.appendChild(li);
        }
    });

    if (contadorAlertas > 0) {
        alertaBox.classList.remove("hidden");
    } else {
        alertaBox.classList.add("hidden");
    }
}

const subSetoresPorSetor = {
    "Perecíveis": [
        "01 ACOUGUE", "02 CONGELADOS", "03 SUPERGELADOS", "04 SALGADOS",
        "05 LATICINIOS I", "06 LATICINIOS II", "07 PEIXARIA", "08 PADARIA",
        "09 HORTIFRUTI", "22 +SAUDAVEIS"
    ],
    "Mercearia": [
        "10 CEREAIS", "11 MASSAS", "12 CONSERVAS", "13 MATINAIS",
        "14 BISCOITOS", "15 SOBREMESAS", "16 BOMBONIERE", "17 BEBIDAS I",
        "18 BEBIDAS II", "19 HIGIENE", "20 LIMPEZA", "21 BAZAR",
        "22 +SAUDAVEIS"
    ]
};

function atualizarSubsetores() {
    const setorSelecionado = document.getElementById("prod-setor").value;
    const subsetorSelect = document.getElementById("prod-subsetor");
    
    subsetorSelect.innerHTML = "";
    
    if (!setorSelecionado) {
        let opt = document.createElement("option");
        opt.value = "";
        opt.innerText = "Escolha um setor primeiro...";
        subsetorSelect.appendChild(opt);
        return;
    }
    
    const listaOpcoes = subSetoresPorSetor[setorSelecionado];
    listaOpcoes.forEach(sub => {
        let opt = document.createElement("option");
        opt.value = sub;
        opt.innerText = sub;
        subsetorSelect.appendChild(opt);
    });
}

function atualizarFiltroSubsetores() {
    const setorSelecionado = document.getElementById("filtro-setor").value;
    const filtroSubSelect = document.getElementById("filtro-subsetor");
    if (!filtroSubSelect) return;
    
    filtroSubSelect.innerHTML = '<option value="Todos">Todos os Sub-setores</option>';
    
    if (setorSelecionado === "Todos") {
        const todosSubsetores = [...subSetoresPorSetor["Perecíveis"], ...subSetoresPorSetor["Mercearia"]];
        const listaUnica = [...new Set(todosSubsetores)];
        
        listaUnica.forEach(sub => {
            let opt = document.createElement("option");
            opt.value = sub;
            opt.innerText = sub;
            filtroSubSelect.appendChild(opt);
        });
    } else if (subSetoresPorSetor[setorSelecionado]) {
        subSetoresPorSetor[setorSelecionado].forEach(sub => {
            let opt = document.createElement("option");
            opt.value = sub;
            opt.innerText = sub;
            filtroSubSelect.appendChild(opt);
        });
    }
    
    renderizarEstoque();
}

function renderizarProdutosDaSecao() {
    const container = document.getElementById("container-produtos-filtrados");
    container.innerHTML = "";

    let produtos = JSON.parse(localStorage.getItem("produtos_cadastrados")) || [];
    let filtrados = produtos.filter(p => p.subsetor === subsetorAtualSelecionado);

    if (filtrados.length === 0) {
        container.innerHTML = "<p style='padding:20px 10px; font-size:14px; text-align:center; color:#7f8c8d;'>Nenhum lote registrado para esta seção.</p>";
        return;
    }

    filtrados.forEach(p => {
        let pRow = document.createElement("div");
        
        if (p.status === "esgotado") {
            pRow.className = "prod-row-mobile esgotado";
            pRow.innerHTML = `
                <div>
                    <strong>${p.descricao}</strong>
                    <div class="prod-info-meta">Cód: ${p.codigo} | <span class="text-esgotado">PRODUTO BAIXADO (Sem estoque)</span></div>
                </div>
                <button class="btn-primary btn-orange" style="width:auto; padding:8px 14px; font-size:13px;" onclick="navegarParaCadastroComCodigo('${p.codigo}')">Recadastrar</button>
            `;
        } else {
            let hoje = new Date();
            let dataVenc = new Date(p.validade + "T00:00:00");
            let diffDays = Math.ceil((dataVenc - hoje) / (1000 * 60 * 60 * 24));
            let visualUrgente = diffDays <= 7 ? "urgente" : "";

            pRow.className = `prod-row-mobile ${visualUrgente}`;
            pRow.innerHTML = `
                <div>
                    <strong>${p.descricao}</strong>
                    <div class="prod-info-meta">Cód: ${p.codigo} | Lote: ${p.lote} | Qtd: ${p.qtd}</div>
                    <div class="prod-info-meta" style="color: ${diffDays <= 7 ? 'var(--danger)' : 'inherit'}; font-weight: ${diffDays <= 7 ? 'bold' : 'normal'}">
                        Vence em: ${dataVenc.toLocaleDateString('pt-BR')} (${diffDays} dias)
                    </div>
                </div>
                ${usuarioLogado.perfil !== 'operador' ? `<button class="btn-primary btn-danger" style="width:auto; padding:8px 14px; font-size:13px;" onclick="darBaixaInterna(${p.id})">Baixar</button>` : ''}
            `;
        }
        container.appendChild(pRow);
    });
}

function darBaixaInterna(id) {
    if (usuarioLogado.perfil === "operador") {
        return dispararModal("Negado", "Apenas Coordenadores ou Gerentes podem dar baixa.");
    }
    
    let produtos = JSON.parse(localStorage.getItem("produtos_cadastrados")) || [];
    let idx = produtos.findIndex(p => p.id === id);
    
    if (idx !== -1) {
        let p = produtos[idx];
        
        let dataHoraAtual = new Date();
        let dataFormatada = dataHoraAtual.toLocaleDateString('pt-BR');
        let horaFormatada = dataHoraAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let historico = JSON.parse(localStorage.getItem("historico_baixas")) || [];
        historico.push({
            idLog: Date.now(),
            codigo: p.codigo,
            descricao: p.descricao,
            setor: p.setor,
            subsetor: p.subsetor,
            lote: p.lote,
            qtdBaixada: p.qtd,
            validadeOriginal: p.validade,
            baixadoPor: usuarioLogado.nome,
            dataBaixa: `${dataFormatada} às ${horaFormatada}`
        });
        localStorage.setItem("historico_baixas", JSON.stringify(historico));

        produtos[idx].status = "esgotado";
        localStorage.setItem("produtos_cadastrados", JSON.stringify(produtos));
    }
    
    verificarAlertasGlobais();
    renderizarProdutosDaSecao();
    renderizarEstoque();
    dispararModal("Sucesso", "Baixa realizada e registrada no log de catálogos do sistema!");
}

let subsetorAtualSelecionado = "";

function abrirSecaoProdutos(secao) {
    subsetorAtualSelecionado = secao;
    document.getElementById("screen-consulta").classList.add("hidden");
    document.getElementById("screen-produtos-subsetor").classList.remove("hidden");
    document.getElementById("titulo-secao-atual").innerText = `Produtos em: ${secao}`;
    
    renderizarProdutosDaSecao();
}

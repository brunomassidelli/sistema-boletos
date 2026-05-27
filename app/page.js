'use client'

import { useEffect, useMemo, useState } from 'react'

const USUARIO = 'Kamban'
const SENHA = '159357'
const ITENS_POR_PAGINA = 10

export default function SistemaControleBoletos() {
  const [logado, setLogado] = useState(false)
  const [loginForm, setLoginForm] = useState({ usuario: '', senha: '' })
  const [erroLogin, setErroLogin] = useState('')

  const [clientes, setClientes] = useState([])
  const [boletos, setBoletos] = useState([])
  const [abrirModal, setAbrirModal] = useState(false)
  const [paginaAtual, setPaginaAtual] = useState(1)

  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '', documento: '' })
  const [novoBoleto, setNovoBoleto] = useState({
    fornecedor: '', valor: '', vencimento: '', parcelas: 1, os: '', nfs: '',
  })
  const [filtros, setFiltros] = useState({
    cliente: '', dataInicio: '', dataFim: '', status: '', esteMes: false,
  })

  function fazerLogin() {
    if (loginForm.usuario === USUARIO && loginForm.senha === SENHA) {
      setLogado(true)
      setErroLogin('')
    } else {
      setErroLogin('Usuário ou senha incorretos.')
    }
  }

  async function carregarClientes() {
    const res = await fetch('/api/clientes')
    const data = await res.json()
    setClientes(data.slice(1))
  }

  async function carregarBoletos() {
    const res = await fetch('/api/boletos')
    const data = await res.json()
    setBoletos(data.slice(1))
  }

  async function cadastrarCliente() {
    if (!novoCliente.nome) return
    await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoCliente),
    })
    setNovoCliente({ nome: '', telefone: '', documento: '' })
    carregarClientes()
  }

  async function gerarParcelas() {
    if (!novoBoleto.fornecedor || !novoBoleto.valor || !novoBoleto.vencimento) return
    const valorParcela = Number(novoBoleto.valor) / Number(novoBoleto.parcelas)
    const novosBoletos = []
    for (let i = 0; i < Number(novoBoleto.parcelas); i++) {
      const data = new Date(novoBoleto.vencimento)
      data.setMonth(data.getMonth() + i)
      novosBoletos.push({
        fornecedor: novoBoleto.fornecedor,
        parcela: `${i + 1}/${novoBoleto.parcelas}`,
        vencimento: data.toLocaleDateString('pt-BR'),
        os: novoBoleto.os,
        nfs: novoBoleto.nfs,
        valor: valorParcela.toFixed(2),
        status: 'Pendente',
      })
    }
    await fetch('/api/boletos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boletos: novosBoletos }),
    })
    setNovoBoleto({ fornecedor: '', valor: '', vencimento: '', parcelas: 1, os: '', nfs: '' })
    setAbrirModal(false)
    carregarBoletos()
  }

  async function marcarComoPago(id) {
    await fetch('/api/boletos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    carregarBoletos()
  }

  useEffect(() => {
    if (logado) {
      carregarClientes()
      carregarBoletos()
    }
  }, [logado])

  const boletosFormatados = boletos.map((b) => ({
    id: b[0],
    cliente: b[0],
    parcela: b[1],
    vencimento: b[2],
    os: b[3],
    nfs: b[4],
    valor: b[5],
    status: b[6],
  }))

  const boletosFiltrados = useMemo(() => {
    return boletosFormatados.filter((boleto) => {
      const clienteMatch = filtros.cliente
        ? boleto.cliente.toLowerCase().includes(filtros.cliente.toLowerCase()) : true
      const dataBoleto = new Date(boleto.vencimento.split('/').reverse().join('-'))
      const dataInicioMatch = filtros.dataInicio ? dataBoleto >= new Date(filtros.dataInicio) : true
      const dataFimMatch = filtros.dataFim ? dataBoleto <= new Date(filtros.dataFim) : true
      const hoje = new Date()
      let statusCalculado = boleto.status
      if (boleto.status !== 'Pago') {
        statusCalculado = dataBoleto < hoje ? 'Vencido' : 'Pendente'
      }
      const statusMatch = filtros.status ? statusCalculado === filtros.status : true
      const esteMesMatch = filtros.esteMes
        ? dataBoleto.getMonth() === hoje.getMonth() && dataBoleto.getFullYear() === hoje.getFullYear() : true
      return clienteMatch && dataInicioMatch && dataFimMatch && statusMatch && esteMesMatch
    })
  }, [boletosFormatados, filtros])

  const totalPaginas = Math.ceil(boletosFiltrados.length / ITENS_POR_PAGINA)
  const boletosNaPagina = boletosFiltrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  )

  const totalReceber = useMemo(() => {
    return boletosFormatados
      .reduce((acc, item) => acc + Number(item.valor || 0), 0)
      .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }, [boletosFormatados])

  const statusColor = {
    Pendente: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/20',
    Pago: 'bg-green-500/20 text-green-300 border border-green-500/20',
    Vencido: 'bg-red-500/20 text-red-300 border border-red-500/20',
  }

  // ─── TELA DE LOGIN ───────────────────────────────────────────
  if (!logado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-900 flex items-center justify-center p-6">
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-10 w-full max-w-md backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-white text-black flex items-center justify-center font-black text-xl">
              KB
            </div>
            <div>
              <p className="text-xs uppercase tracking-[5px] text-gray-400">Finance SaaS</p>
              <h1 className="text-2xl font-black text-white">Controle de Boletos</h1>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Usuário</label>
              <input
                value={loginForm.usuario}
                onChange={(e) => setLoginForm({ ...loginForm, usuario: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && fazerLogin()}
                placeholder="Digite seu usuário"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-4 outline-none text-white"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Senha</label>
              <input
                type="password"
                value={loginForm.senha}
                onChange={(e) => setLoginForm({ ...loginForm, senha: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && fazerLogin()}
                placeholder="Digite sua senha"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-4 outline-none text-white"
              />
            </div>

            {erroLogin && (
              <p className="text-red-400 text-sm font-semibold">{erroLogin}</p>
            )}

            <button
              onClick={fazerLogin}
              className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── TELA PRINCIPAL ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl shadow-2xl">

          {/* Cabeçalho */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-white text-black flex items-center justify-center font-black text-xl">
                  KB
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[5px] text-gray-400">Finance SaaS</p>
                  <h1 className="text-4xl font-black">Sistema de Controle de Boletos</h1>
                </div>
              </div>
              <p className="text-gray-400 text-lg max-w-2xl">
                Plataforma profissional para gestão de cobranças parceladas.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAbrirModal(true)}
                className="bg-white text-black px-6 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-2xl"
              >
                + Novo Boleto
              </button>
              <button
                onClick={() => setLogado(false)}
                className="bg-white/10 border border-white/10 text-white px-6 py-4 rounded-2xl font-bold hover:bg-white/20 transition-all"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-6">
              <p className="text-gray-400 text-sm uppercase tracking-widest">Total Receber</p>
              <h2 className="text-4xl font-black mt-3">{totalReceber}</h2>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-6">
              <p className="text-gray-400 text-sm uppercase tracking-widest">Fornecedores</p>
              <h2 className="text-4xl font-black mt-3">{clientes.length}</h2>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-6">
              <p className="text-gray-400 text-sm uppercase tracking-widest">Boletos</p>
              <h2 className="text-4xl font-black mt-3">{boletos.length}</h2>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 mb-8">
            <h3 className="text-xl font-black mb-6">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                value={filtros.cliente}
                onChange={(e) => { setFiltros({ ...filtros, cliente: e.target.value }); setPaginaAtual(1) }}
                placeholder="Fornecedor"
                className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3 outline-none"
              />
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => { setFiltros({ ...filtros, dataInicio: e.target.value }); setPaginaAtual(1) }}
                className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3 outline-none"
              />
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => { setFiltros({ ...filtros, dataFim: e.target.value }); setPaginaAtual(1) }}
                className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3 outline-none"
              />
              <select
                value={filtros.esteMes ? 'esteMes' : filtros.status}
                onChange={(e) => {
                  if (e.target.value === 'esteMes') {
                    setFiltros({ ...filtros, status: '', esteMes: true })
                  } else {
                    setFiltros({ ...filtros, status: e.target.value, esteMes: false })
                  }
                  setPaginaAtual(1)
                }}
                className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3 outline-none"
              >
                <option value="">Todos Status</option>
                <option value="Pago">Pago</option>
                <option value="Pendente">Pendente</option>
                <option value="Vencido">Vencido</option>
                <option value="esteMes">Este Mês</option>
              </select>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white/5 border border-white/10 rounded-[28px] overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    {['Fornecedor', 'Parcela', 'Vencimento', 'OS', 'NFS', 'Valor', 'Status', 'Ações'].map((h) => (
                      <th key={h} className="text-left px-6 py-4 text-xs uppercase tracking-widest text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {boletosNaPagina.map((boleto, index) => {
                    const dataBoleto = new Date(boleto.vencimento.split('/').reverse().join('-'))
                    const statusFinal = boleto.status === 'Pago' ? 'Pago' : dataBoleto < new Date() ? 'Vencido' : 'Pendente'
                    return (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-6 py-5 font-semibold">{boleto.cliente}</td>
                        <td className="px-6 py-5 text-gray-300">{boleto.parcela}</td>
                        <td className="px-6 py-5 text-gray-300">{boleto.vencimento}</td>
                        <td className="px-6 py-5 text-gray-300">{boleto.os || '—'}</td>
                        <td className="px-6 py-5 text-gray-300">{boleto.nfs || '—'}</td>
                        <td className="px-6 py-5 font-black">
                          {Number(boleto.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColor[statusFinal]}`}>
                            {statusFinal}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {statusFinal !== 'Pago' && (
                            <button
                              onClick={() => marcarComoPago(boleto.id)}
                              className="bg-green-500/20 text-green-300 border border-green-500/30 px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-500/40 transition-all"
                            >
                              ✓ Marcar Pago
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mb-8 px-2">
              <p className="text-gray-400 text-sm">
                Mostrando {(paginaAtual - 1) * ITENS_POR_PAGINA + 1}–{Math.min(paginaAtual * ITENS_POR_PAGINA, boletosFiltrados.length)} de {boletosFiltrados.length} boletos
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
                  disabled={paginaAtual === 1}
                  className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl font-bold disabled:opacity-30 hover:bg-white/10 transition-all"
                >
                  ← Anterior
                </button>
                <span className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl font-bold">
                  {paginaAtual} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPaginaAtual((p) => Math.min(p + 1, totalPaginas))}
                  disabled={paginaAtual === totalPaginas}
                  className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl font-bold disabled:opacity-30 hover:bg-white/10 transition-all"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}

          {/* Cadastro de fornecedor */}
          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6">
            <h3 className="text-2xl font-black mb-6">Cadastro de Fornecedor</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                value={novoCliente.nome}
                onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                placeholder="Nome"
                className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3 outline-none"
              />
              <input
                value={novoCliente.telefone}
                onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                placeholder="Telefone"
                className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3 outline-none"
              />
              <input
                value={novoCliente.documento}
                onChange={(e) => setNovoCliente({ ...novoCliente, documento: e.target.value })}
                placeholder="CPF ou CNPJ"
                className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3 outline-none"
              />
              <button
                onClick={cadastrarCliente}
                className="bg-white text-black rounded-2xl font-bold"
              >
                Cadastrar
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modal Novo Boleto */}
      {abrirModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-zinc-950 border border-white/10 rounded-[32px] p-8 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black">Novo Boleto</h2>
              <button onClick={() => setAbrirModal(false)} className="bg-white/10 h-10 w-10 rounded-xl">X</button>
            </div>
            <div className="space-y-4">
              <input
                list="fornecedores"
                placeholder="Fornecedor"
                value={novoBoleto.fornecedor}
                onChange={(e) => setNovoBoleto({ ...novoBoleto, fornecedor: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-4 outline-none"
              />
              <datalist id="fornecedores">
                {clientes.map((c, i) => <option key={i} value={c[0]} />)}
              </datalist>

              <input
                type="number"
                placeholder="Valor total"
                value={novoBoleto.valor}
                onChange={(e) => setNovoBoleto({ ...novoBoleto, valor: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-4 outline-none"
              />
              <input
                type="date"
                value={novoBoleto.vencimento}
                onChange={(e) => setNovoBoleto({ ...novoBoleto, vencimento: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-4 outline-none"
              />
              <input
                type="number"
                min="1"
                placeholder="Quantidade de parcelas"
                value={novoBoleto.parcelas}
                onChange={(e) => setNovoBoleto({ ...novoBoleto, parcelas: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-4 outline-none"
              />
              <input
                placeholder="Número da OS (opcional)"
                value={novoBoleto.os}
                onChange={(e) => setNovoBoleto({ ...novoBoleto, os: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-4 outline-none"
              />
              <input
                placeholder="Número da NFS (opcional)"
                value={novoBoleto.nfs}
                onChange={(e) => setNovoBoleto({ ...novoBoleto, nfs: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-4 outline-none"
              />
              <button
                onClick={gerarParcelas}
                className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg"
              >
                Gerar Boletos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
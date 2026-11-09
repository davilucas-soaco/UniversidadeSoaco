import { prisma } from '../config/prisma.js'

export type UsuarioSessao = {
  id: string
  name: string
  firstName: string
  email: string
  role: string
  jobTitle: string
  sector: string
  initials: string
  phone: string | null
  location: string | null
  photoUrl: string | null
  classes: string[]
  mustChangePassword: boolean
}

const papelLabel: Record<string, string> = {
  administrador: 'Administrador',
  gestor_conteudo: 'Gestor de conteúdo',
  colaborador: 'Colaborador',
}

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

export async function carregarUsuarioSessao(usuarioId: string): Promise<UsuarioSessao | null> {
  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, ativo: true },
    include: { setor: true, classes: { include: { classe: true } } },
  })
  if (!usuario) return null

  return {
    id: usuario.id,
    name: usuario.nome,
    firstName: usuario.nome.split(' ').filter(Boolean)[0] ?? usuario.nome,
    email: usuario.email,
    role: usuario.papel,
    jobTitle: usuario.cargo || papelLabel[usuario.papel] || 'Colaborador',
    sector: usuario.setor?.nome ?? '',
    initials: iniciais(usuario.nome),
    phone: usuario.telefone,
    location: usuario.localizacao,
    photoUrl: usuario.fotoUrl,
    classes: usuario.classes.map((item) => item.classe.nome),
    mustChangePassword: usuario.trocarSenha,
  }
}

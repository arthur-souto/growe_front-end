import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { authService } from "@/api/services/auth-service"
import { Spinner } from "@/components/ui/spinner"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // chamar sua API Spring aqui
    try {
      const { accessToken } = (await authService.signIn({ email, password })).data
      console.log(accessToken)
      toast.success("Login bem-sucedido!")
    } catch (error) {
      toast.error("Erro ao fazer login. Verifique suas credenciais.")
      setLoading(false)
    }
    finally {
        setLoading(false)
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-3xl overflow-hidden rounded-sm border border-border">
        {/* Left — brand panel */}
        <div className="hidden flex-1 flex-col justify-between bg-foreground p-10 md:flex">
          <div className="flex items-center gap-2.5">
            {/* logo */}
            <img className="h-10 w-10 rounded-md" src="/icon.png" alt="" />
            <span className="text-lg font-medium text-background">Growe</span>
          </div>

          <div>
            <p className="mb-4 text-sm leading-relaxed text-muted">
              "Empresas crescem quando reconhecem quem está todos os dias
              construindo resultados de verdade. Funcionários dedicados,
              comprometidos e proativos não devem passar despercebidos. "
            </p>
            <div className="flex items-center gap-2.5">
              <Avatar>
                <AvatarImage src="/founder.jpeg" />
                <AvatarFallback>AS</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-medium text-background">
                  Arthur S. - Fundador da Growe
                </p>
                <p className="text-xs text-muted-foreground">Growe Software</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right — form panel */}
        <div className="flex flex-1 items-center justify-center bg-background p-10">
          <div className="w-full max-w-xs">
            <h1 className="mb-1.5 text-xl font-medium text-foreground">
              Acessar conta
            </h1>
            <p className="mb-7 text-sm text-muted-foreground">
              Digite seu e-mail e senha para entrar.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Senha
                  </label>
                  <a
                    href="#"
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>

              <Button type="submit" className="w-full cursor-pointer">
                Entrar {loading ? <Spinner className="ml-2" /> : null}
              </Button>
            </form>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              Problemas para acessar? Fale com o seu RH.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

OMNI SOUNDS — configuração do Firebase

O que foi alterado:
- src/firebase.ts agora aponta para o projeto Firebase `omni-sounds`.
- O Firestore usa a base de dados `(default)` do novo projeto.
- firebase-applet-config.json foi atualizado para o mesmo projeto.
- Nenhum dado antigo foi importado e o projeto antigo não foi alterado.

ANTES DE PUBLICAR:
1. No Firebase Console, projeto `omni-sounds`, confirme que Cloud Firestore já foi criado.
2. Em Firestore > Regras, publique as regras que estão no ficheiro `firestore.rules` deste ZIP. Reveja-as primeiro, pois as regras permitem leituras públicas dos beats/projetos/settings e criação pública validada de pedidos/compras; não publique regras abertas a todos.
3. Em Authentication > Sign-in method, ative Google se o site usar o botão de login Google.
4. Em Authentication > Settings > Authorized domains, adicione o domínio onde o site está alojado.
5. Publique/reconstrua o site com esta versão atualizada.

IMPORTANTE:
- A configuração Firebase Web (incluindo apiKey) é usada no cliente e não é uma palavra-passe. Nunca coloque chaves privadas de contas de serviço no código do site.
- A base nova começa vazia; os dados do projeto antigo não foram copiados.
- O Storage bucket está configurado no código, mas o Firebase Storage não foi ativado nem testado neste processo.
- Não foi possível executar `npm run build` neste ambiente porque as dependências npm (incluindo Vite) não estão instaladas. Portanto, o build ainda precisa ser testado na plataforma onde o projeto será publicado.

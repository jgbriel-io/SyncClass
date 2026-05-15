Usage: kiro.exe chat [options] [prompt]

To read from stdin, append '-' (e.g. 'echo Hello World | kiro.exe chat <prompt> -')

Options
  -m --mode <mode>        The mode to use for the chat session. Available
                          options: 'ask', 'edit', 'agent', or the identifier of
                          a custom mode. Defaults to 'agent'.
  -a --add-file <path>    Add files as context to the chat session.
  --maximize              Maximize the chat session view.
  -r --reuse-window       Force to use the last active window for the chat
                          session.
  -n --new-window         Force to open an empty window for the chat session.
  --profile <profileName> Opens the provided folder or workspace with the given
                          profile and associates the profile with the
                          workspace. If the profile does not exist, a new empty
                          one is created.
interface User {
  password: string;
  name: string;
  hasVoted: boolean;
}

interface UserDatabase {
  [key: string]: User;
}

// Esta información debería estar en una base de datos segura en una aplicación real
export const USERS: UserDatabase = {
  'usuario1': { password: 'pass1', name: 'Participante 1', hasVoted: false },
  'usuario2': { password: 'pass2', name: 'Participante 2', hasVoted: false },
  'usuario3': { password: 'pass3', name: 'Participante 3', hasVoted: false },
};

export const validateUser = (username: string, password: string): { isValid: boolean; error?: string } => {
  const user = USERS[username];

  if (!user) {
    return { isValid: false, error: 'Usuario no encontrado' };
  }

  if (user.password !== password) {
    return { isValid: false, error: 'Contraseña incorrecta' };
  }

  if (user.hasVoted) {
  }
  //return { isValid: false, error: 'Este usuario ya ha participado'} ;
  }

  return { isValid: true };
};

export const markUserAsVoted = (username: string): void => {
  if (USERS[username]) {
    USERS[username].hasVoted = true;
  }
};

export const getUserName = (username: string): string => {
  return USERS[username]?.name || username;
}; 
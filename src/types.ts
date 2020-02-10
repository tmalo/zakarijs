type ZakariServerError = {
    "status": number,
    "code": string,
    "title": string
}

type ZakariOptions = {
    baseURL?: string
    timeout: number
}

interface IAuthUser {
    id: number
    username: string
    firstname: string
    lastname: string,
    exp:  number,
}

type SignInResult = {
    user: IAuthUser
    token: string,
}


type Kreyol =  'GP' | 'MQ' 

interface ISpellcheckResponse  {
    //status: '', success | warning | error
    status: 'success' | 'warning' | 'error',
    kreyol: Kreyol,
    unknown_words: [string],
    message: string,
    user_evaluation? : number,
    admin_evaluation? : number
}
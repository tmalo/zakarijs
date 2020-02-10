import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { basename } from 'path';
import { stringify } from 'querystring';
const Promise = require("bluebird");
var setCookie = require('set-cookie-parser');

/**
 * A connection to the zakari server
 */
class ZakariConnection {
    private server: ZakariOptions
    private credentials: SignInResult
    private refresh: {
        token: string
        expires: Date
    }

    constructor(_server:ZakariOptions, _login: SignInResult, _refresh: {token: string, expires: Date}) {
        this.server =_server;
        this.credentials = _login;
        this.refresh = _refresh;
    }

    private async makeRequest(): Promise<AxiosInstance> {
    
        let options = {
            baseURL: this.server.baseURL,
            timeout: this.server.timeout,
            headers:  {
                'User-Agent': 'Zakari App',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization':  `Bearer ${this.credentials.token}`
              },
              withCredentials: true,
            };
    
        let instance = axios.create(options);
    
        return instance;
    }

    /**
     * Verify the spelling
     * @param kreyol which kreyol to use
     * @param request a text to spellcheck
     */
    spellcheck(kreyol: Kreyol, request: string): Promise<ISpellcheckResponse> {
        let me = this;
        return new Promise( async function (resolve, reject) {
            return me.makeRequest()
            .catch(error => {
                reject(error)
                return false;
            })
            .then(function(value: boolean | AxiosInstance): any {
                if (!value)
                    return false;

                var req: AxiosInstance = value as AxiosInstance
                return req.post('/spellcheck', {
                    "kreyol": kreyol,
                    "request": request
                })
            })
            .catch(rep => {
                let badresponse = rep.response;

                let rep_error = badresponse.data.errors[0]
                console.log({status: badresponse.status, text: badresponse.statusText})
                let _error: ZakariServerError = {
                    status: badresponse.data ? rep_error.status : badresponse.status,
                    code: badresponse.data ? rep_error.code : '',
                    title: badresponse.data ? rep_error.title : badresponse.statusText,
                    
                }

                reject(_error) 
                return false                
            })
            .then(response => {
                if (!response)
                    return false;

                resolve(response.data)
                return response.data;
            })
        })        
    }

    /**
     * get the user info
     * @returns the user info
     */
    getUser(): IAuthUser {
        return this.credentials.user
    }
}

/**
 * The client module for zakari
 */
export default class zakari {
    server: string
    options: ZakariOptions
    connection?: ZakariConnection

    /**
     * The client module for zakari
     * @param server_url The url of the zakari server
     * @param options options
     */
    constructor(server_url: string, options: ZakariOptions = {
        timeout: 1000
    }) {
        this.server = server_url;
        this.options= options;
        this.options.baseURL = server_url;
        this.connection = undefined

    }

    private async makeRequest(): Promise<AxiosInstance> {
    
        let options = {
            baseURL: this.server,
            timeout: this.options.timeout,
            headers:  {
                'User-Agent': 'Zakari App',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            withCredentials: true,

        };
    
/*         if (!noToken && this.access_token) {
            options.headers.Authorization= `Bearer ${this.access_token}`
        } */
        let instance = axios.create(options);
    
        return instance;
    }

    /**
     * Connect to the zakari server
     * @param username the user login
     * @param password the user password
     */
    signIn(username: string, password: string): Promise<ZakariConnection> {
        let me = this;
        return new Promise( async function (resolve, reject) {

            //var instance: AxiosInstance;
            me.makeRequest()
            .catch(error => {
                reject(error)
                return false;
            })
            .then(
                function(value: boolean | AxiosInstance): any {
                if (!value)
                    return false;
    
                var req: AxiosInstance = value as AxiosInstance
                return req.post('/auth/login', {
                    username: username,
                    password: password
                })
            })
            .catch(rep => {
                let badresponse = rep.response;
                if (badresponse) {
                    let rep_error = badresponse.data.errors[0]
                    console.log({status: badresponse.status, text: badresponse.statusText})
                    let _error: ZakariServerError = {
                        status: badresponse.data ? rep_error.status : badresponse.status,
                        code: badresponse.data ? rep_error.code : '',
                        title: badresponse.data ? rep_error.title : badresponse.statusText,
                        
                    }

                    reject(_error) 
                } else if (rep.message==="Network Error") {
                    let _error: ZakariServerError = {
                        status: 500,
                        code: 'NETWORK_ERROR',
                        title: 'Cannot contact server',
                        
                    }

                    reject(_error) 

                }
                return false                
            })
            .then (response => {
                if (!response)
                    return false;
                
                var cookies = setCookie.parse(response, {
                    decodeValues: true,  // default: true
                    map: true           //default: false
                  });

                //console.log(response.headers)

                let answer: ZakariConnection = new ZakariConnection(me.options, 
                    response.data,
                    {
                        token: cookies.refresh_token ? cookies.refresh_token.value : '',
                        expires: cookies.refresh_token ? cookies.refresh_token.expires : undefined
                    }
                )

                me.connection= answer
                resolve(answer)

                return answer;
            })
           
        })
    }
}


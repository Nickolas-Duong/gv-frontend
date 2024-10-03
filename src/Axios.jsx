import axios from 'axios'

const baseUrl = 'http://newgv-env.eba-8afbetm7.us-west-1.elasticbeanstalk.com/'

const AxiosInstance = axios.create({
    baseURL: baseUrl,
    timeout: 5000,
    headers: {
        "Content-Type": "application/json",
        accept: "application/json"



    }





})

export default AxiosInstance
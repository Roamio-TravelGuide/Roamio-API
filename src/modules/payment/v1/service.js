import { PaymentRepository } from './repository.js';


export class PaymentService {
    constructor(){
        this.paymentRepository = new PaymentRepository();
    }

    async getPayment(id){
        const payment =  this.paymentRepository.getPayment
        return payment;
    }
    
    async getTotalRevenue(){
        return this.paymentRepository.getTotalRevenue();
    }
}


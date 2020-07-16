class A{
    
    constructor(){
        this.#name = "asd1";
        console.log(this.#name)
    }
}




let a = new A();
console.log(a.#name )
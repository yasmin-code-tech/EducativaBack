"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
class AdminController {
    async enter(request, response) {
        return response.json({ message: "Bem-vindo admin!" });
    }
}
exports.AdminController = AdminController;

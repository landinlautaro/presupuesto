using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PresupuestoApi.DTOs;
using PresupuestoApi.Services;

namespace PresupuestoApi.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly TokenService _tokenService;
    private readonly IWebHostEnvironment _env;

    public AuthController(IConfiguration config, TokenService tokenService, IWebHostEnvironment env)
    {
        _config = config;
        _tokenService = tokenService;
        _env = env;
    }

    /// <summary>
    /// Login. Devuelve un JWT de 7 días.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var expectedEmail = _config["Auth:Email"];
        var passwordHash = _config["Auth:PasswordHash"];

        if (string.IsNullOrEmpty(expectedEmail) || string.IsNullOrEmpty(passwordHash))
            return StatusCode(500, new { message = "Auth no configurado en appsettings" });

        var emailMatch = string.Equals(request.Email, expectedEmail, StringComparison.OrdinalIgnoreCase);
        var passwordMatch = BCrypt.Net.BCrypt.Verify(request.Password, passwordHash);

        if (!emailMatch || !passwordMatch)
            return Unauthorized(new { message = "Credenciales inválidas" });

        var token = _tokenService.GenerateToken(request.Email);
        return Ok(new LoginResponse(token));
    }

    /// <summary>
    /// Solo Development: genera un BCrypt hash para configurar Auth:PasswordHash.
    /// GET /auth/dev/hash?password=tu_password
    /// </summary>
    [HttpGet("dev/hash")]
    [AllowAnonymous]
    public IActionResult DevHash([FromQuery] string password)
    {
        if (!_env.IsDevelopment())
            return NotFound();

        if (string.IsNullOrWhiteSpace(password))
            return BadRequest(new { message = "Parámetro 'password' requerido" });

        var hash = BCrypt.Net.BCrypt.HashPassword(password);
        return Ok(new { hash });
    }
}

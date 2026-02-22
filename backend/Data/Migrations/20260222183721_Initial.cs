using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PresupuestoApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "asignacion",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    mes = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    activo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    monto_ars = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    fx_tipo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    tc = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    monto_usd = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    nota = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asignacion", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "fx",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    mes = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    oficial = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    mep = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    ccl = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    blue = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    notas = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fx", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "movimientos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    mes = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    tipo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    categoria = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    descripcion = table.Column<string>(type: "text", nullable: false),
                    monto_ars = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    cuenta_medio = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    tags = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movimientos", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_fx_mes",
                table: "fx",
                column: "mes",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "asignacion");

            migrationBuilder.DropTable(
                name: "fx");

            migrationBuilder.DropTable(
                name: "movimientos");
        }
    }
}

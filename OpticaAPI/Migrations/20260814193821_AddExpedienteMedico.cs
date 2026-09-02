using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpticaAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddExpedienteMedico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Expedientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PacienteId = table.Column<int>(type: "int", nullable: false),
                    Ocupacion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Alergias = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    EnfermedadesSistemicas = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    MedicamentosActuales = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    AntecedentesFamiliares = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Observaciones = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Expedientes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Expedientes_Pacientes_PacienteId",
                        column: x => x.PacienteId,
                        principalTable: "Pacientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Expedientes_PacienteId",
                table: "Expedientes",
                column: "PacienteId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Expedientes");
        }
    }
}

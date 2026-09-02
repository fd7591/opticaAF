using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpticaAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddVentaToGraduacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Venta",
                table: "Graduaciones",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Venta",
                table: "Graduaciones");
        }
    }
}

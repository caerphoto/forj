class FoldersController < ApplicationController
    def create
        folder = Folder.create(
            :name => params[:name]
        )
        folder.save
        redirect_to msg_threads_path
    end

    def destroy
        folder = Folder.find(params[:id])
        if current_user.rank < 1
            return render :text => "UNAUTHORISED"
        end

        folder.destroy

        redirect_to msg_threads_path
    end

    def edit
        folder = Folder.find(params[:id])
        if current_user.rank < 1
            return render :text => "UNAUTHORISED"
        end

        folder.name = params[:newname]
        folder.save

        render :text => folder.name
    end
end
